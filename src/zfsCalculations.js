// ZFS Storage Calculations
// Based on standard ZFS overhead and formatting requirements

/**
 * Convert TB to TiB
 * 1 TB = 1000 GB, 1 TiB = 1024 GiB
 */
export function tbToTib(tb) {
  return tb / 1.099511627776
}

/**
 * Convert TiB to TB
 */
export function tibToTb(tib) {
  return tib * 1.099511627776
}

/**
 * Calculate slop space allocation
 * ZFS reserves 1/32 of total pool capacity
 * Minimum 128 MiB, maximum half the pool
 */
export function calculateSlopSpace(totalCapacityTib) {
  const slopSpace = totalCapacityTib / 32
  const minSlop = 128 / 1024 / 1024 // 128 MiB in TiB
  const maxSlop = totalCapacityTib / 2

  return Math.max(minSlop, Math.min(slopSpace, maxSlop))
}

/**
 * Calculate parity overhead for RAIDZ configurations
 */
export function calculateParityOverhead(raidType, drivesPerVdev) {
  switch (raidType) {
    case 'stripe':
      return 0
    case 'mirror':
      // Mirrors store full copies, so overhead is (n-1)/n
      return (drivesPerVdev - 1) / drivesPerVdev
    case 'raidz1':
      return 1 / drivesPerVdev
    case 'raidz2':
      return 2 / drivesPerVdev
    case 'raidz3':
      return 3 / drivesPerVdev
    default:
      return 0
  }
}

/**
 * Calculate ZFS metadata overhead (approximately 1-2%)
 */
export function calculateMetadataOverhead(capacityTib) {
  return capacityTib * 0.015 // 1.5% for metadata
}

/**
 * Calculate usable capacity for a single vdev
 */
export function calculateVdevCapacity(raidType, driveCapacityTb, numDrives) {
  const driveCapacityTib = tbToTib(driveCapacityTb)
  const totalRawTib = driveCapacityTib * numDrives

  // Apply parity overhead
  const parityOverhead = calculateParityOverhead(raidType, numDrives)
  const afterParity = totalRawTib * (1 - parityOverhead)

  // For mirrors, usable space is simply one drive's worth
  if (raidType === 'mirror') {
    return {
      rawTib: totalRawTib,
      rawTb: driveCapacityTb * numDrives,
      usableTib: driveCapacityTib,
      usableTb: driveCapacityTb,
      parityOverheadTib: totalRawTib - driveCapacityTib,
      parityOverheadTb: driveCapacityTb * (numDrives - 1)
    }
  }

  // For RAIDZ, account for stripe padding overhead (~3%)
  const stripePaddingOverhead = raidType.startsWith('raidz') ? 0.03 : 0
  const afterStripePadding = afterParity * (1 - stripePaddingOverhead)

  return {
    rawTib: totalRawTib,
    rawTb: driveCapacityTb * numDrives,
    usableTib: afterStripePadding,
    usableTb: tibToTb(afterStripePadding),
    parityOverheadTib: totalRawTib - afterStripePadding,
    parityOverheadTb: tibToTb(totalRawTib - afterStripePadding)
  }
}

/**
 * Calculate total pool capacity from multiple vdevs
 */
export function calculatePoolCapacity(vdevs) {
  if (!vdevs || vdevs.length === 0) {
    return {
      totalRawTib: 0,
      totalRawTb: 0,
      zpoolCapacityTib: 0,
      zpoolCapacityTb: 0,
      slopSpaceTib: 0,
      slopSpaceTb: 0,
      metadataOverheadTib: 0,
      metadataOverheadTb: 0,
      zfsUsableTib: 0,
      zfsUsableTb: 0,
      parityOverheadTib: 0,
      parityOverheadTb: 0
    }
  }

  let totalRawTib = 0
  let totalRawTb = 0
  let totalUsableTib = 0
  let totalParityOverheadTib = 0

  // Sum up all vdevs
  vdevs.forEach(vdev => {
    if (vdev.drives && vdev.drives.length > 0) {
      const vdevCalc = calculateVdevCapacity(
        vdev.raidType,
        vdev.drives[0].capacityTb,
        vdev.drives.length
      )
      totalRawTib += vdevCalc.rawTib
      totalRawTb += vdevCalc.rawTb
      totalUsableTib += vdevCalc.usableTib
      totalParityOverheadTib += vdevCalc.parityOverheadTib
    }
  })

  // Calculate slop space (reserved by ZFS)
  const slopSpaceTib = calculateSlopSpace(totalUsableTib)
  const slopSpaceTb = tibToTb(slopSpaceTib)

  // Calculate metadata overhead
  const metadataOverheadTib = calculateMetadataOverhead(totalUsableTib)
  const metadataOverheadTb = tibToTb(metadataOverheadTib)

  // Final usable capacity
  const zfsUsableTib = totalUsableTib - slopSpaceTib - metadataOverheadTib
  const zfsUsableTb = tibToTb(zfsUsableTib)

  return {
    totalRawTib,
    totalRawTb,
    zpoolCapacityTib: totalUsableTib,
    zpoolCapacityTb: tibToTb(totalUsableTib),
    slopSpaceTib,
    slopSpaceTb,
    metadataOverheadTib,
    metadataOverheadTb,
    zfsUsableTib,
    zfsUsableTb,
    parityOverheadTib: totalParityOverheadTib,
    parityOverheadTb: tibToTb(totalParityOverheadTib),
    recommendedFreeTib: totalRawTib * 0.20,
    recommendedFreeTb: totalRawTb * 0.20,
    practicalUsableTib: Math.max(0, zfsUsableTib - (totalRawTib * 0.20)),
    practicalUsableTb: Math.max(0, tibToTb(zfsUsableTib) - (totalRawTb * 0.20))
  }
}

/**
 * Calculate recommended RAM
 * Basic: 1 GB per TB of raw storage (minimum 8GB)
 * Deduplication: 5 GB per TB of raw storage (minimum 16GB)
 */
export function calculateRecommendedRAM(totalRawTb, useDedup = false) {
  const ratio = useDedup ? 5 : 1
  const calculated = Math.ceil(totalRawTb * ratio)
  const minimum = useDedup ? 16 : 8

  return Math.max(calculated, minimum)
}

/**
 * Get RAID type characteristics
 */
export function getRaidTypeInfo(raidType) {
  const info = {
    stripe: {
      name: 'Stripe',
      description: 'No redundancy - maximum performance and capacity',
      minDrives: 1,
      maxDrives: Infinity,
      faultTolerance: 0,
      readSpeed: 'Excellent',
      writeSpeed: 'Excellent',
      recommendation: 'Use only for non-critical data or when backed by other redundancy'
    },
    mirror: {
      name: 'Mirror',
      description: 'Full copies of data across drives - maximum redundancy',
      minDrives: 2,
      maxDrives: Infinity,
      faultTolerance: 'N-1 drives',
      readSpeed: 'Excellent',
      writeSpeed: 'Good',
      recommendation: 'Best for high-performance workloads and critical data'
    },
    raidz1: {
      name: 'RAIDZ1',
      description: 'Single parity - good balance of capacity and protection',
      minDrives: 3,
      maxDrives: Infinity,
      optimalDrives: '3-9',
      faultTolerance: 1,
      readSpeed: 'Good',
      writeSpeed: 'Fair',
      recommendation: 'Minimum 3 drives, optimal 3-9 drives per vdev'
    },
    raidz2: {
      name: 'RAIDZ2',
      description: 'Double parity - excellent protection with good capacity',
      minDrives: 4,
      maxDrives: Infinity,
      optimalDrives: '4-10',
      faultTolerance: 2,
      readSpeed: 'Good',
      writeSpeed: 'Fair',
      recommendation: 'Recommended for most use cases, optimal 6-10 drives per vdev'
    },
    raidz3: {
      name: 'RAIDZ3',
      description: 'Triple parity - maximum protection for critical data',
      minDrives: 5,
      maxDrives: Infinity,
      optimalDrives: '5-15',
      faultTolerance: 3,
      readSpeed: 'Good',
      writeSpeed: 'Fair',
      recommendation: 'Best for large archives and critical data, optimal 9-15 drives per vdev'
    }
  }

  return info[raidType] || info.stripe
}

/**
 * Validate vdev configuration
 */
export function validateVdev(raidType, numDrives) {
  const info = getRaidTypeInfo(raidType)
  const errors = []

  if (numDrives < info.minDrives) {
    errors.push(`${info.name} requires at least ${info.minDrives} drives`)
  }

  if (raidType === 'raidz1' && numDrives < 3) {
    errors.push('RAIDZ1 requires at least 3 drives')
  }

  if (raidType === 'raidz2' && numDrives < 4) {
    errors.push('RAIDZ2 requires at least 4 drives')
  }

  if (raidType === 'raidz3' && numDrives < 5) {
    errors.push('RAIDZ3 requires at least 5 drives')
  }

  return errors
}

/**
 * Calculate recommended ZIL/SLOG size based on RAM
 * Typical recommendation: match physical RAM or at least 8GB
 */
export function calculateZILSize(systemRAMGb) {
  return Math.max(8, systemRAMGb)
}

/**
 * Calculate recommended L2ARC size
 * Typical recommendation: 5-10x the size of RAM
 */
export function calculateL2ARCSize(systemRAMGb) {
  return systemRAMGb * 5 // Conservative 5x multiplier
}
