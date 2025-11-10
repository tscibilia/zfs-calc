<template>
  <div class="educational-section">
    <div class="card">
      <div class="card-header">
        <h2>Understanding ZFS Storage Types</h2>
      </div>

      <div class="raid-types">
        <div v-for="type in raidTypes" :key="type.id" class="raid-type-card">
          <div class="raid-type-header">
            <h3>{{ type.name }}</h3>
            <span class="badge" :class="type.badgeClass">{{ type.badge }}</span>
          </div>
          <p class="description">{{ type.description }}</p>

          <div class="specs-grid">
            <div class="spec-item">
              <span class="spec-label">Minimum Drives:</span>
              <span class="spec-value">{{ type.minDrives }}</span>
            </div>
            <div class="spec-item" v-if="type.optimalDrives">
              <span class="spec-label">Optimal Range:</span>
              <span class="spec-value">{{ type.optimalDrives }} drives</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Fault Tolerance:</span>
              <span class="spec-value">{{ type.faultTolerance }}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Read Speed:</span>
              <span class="spec-value">{{ type.readSpeed }}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Write Speed:</span>
              <span class="spec-value">{{ type.writeSpeed }}</span>
            </div>
          </div>

          <div class="recommendation">
            <strong>Recommendation:</strong> {{ type.recommendation }}
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>Storage Terminology</h2>
      </div>

      <div class="terminology-grid">
        <div v-for="term in terminology" :key="term.term" class="term-item">
          <h4>{{ term.term }}</h4>
          <p>{{ term.definition }}</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>Optional ZFS Features</h2>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <h3>ZIL / SLOG</h3>
          <p><strong>ZFS Intent Log (ZIL)</strong> is used for synchronous writes. Adding a dedicated SLOG (Separate Log) device, typically a fast SSD, can significantly improve sync write performance.</p>
          <ul>
            <li><strong>Sizing:</strong> Usually matches RAM size (8-16 GB typical)</li>
            <li><strong>Redundancy:</strong> Mirror recommended for data safety</li>
            <li><strong>Use case:</strong> Database servers, NFS with sync writes, VMs</li>
          </ul>
        </div>

        <div class="feature-card">
          <h3>L2ARC</h3>
          <p><strong>Level 2 Adaptive Replacement Cache</strong> extends the in-memory ARC cache using fast SSDs, improving read performance for frequently accessed data.</p>
          <ul>
            <li><strong>Sizing:</strong> 5-10x RAM size (larger is better)</li>
            <li><strong>Redundancy:</strong> Not required (cache only, not critical)</li>
            <li><strong>Use case:</strong> Read-heavy workloads with working set larger than RAM</li>
          </ul>
        </div>

        <div class="feature-card">
          <h3>Special Metadata vdev</h3>
          <p><strong>Metadata-only special vdev</strong> stores filesystem metadata and optionally small blocks on fast SSDs, dramatically improving metadata-intensive operations and small file performance.</p>
          <ul>
            <li><strong>Sizing:</strong> Typically 10-20% of data pool size, minimum 32 GB</li>
            <li><strong>Redundancy:</strong> Mirror (2-way) or 3-way mirror strongly recommended</li>
            <li><strong>Use case:</strong> Workloads with many small files, heavy metadata operations, or VMs</li>
            <li><strong>Warning:</strong> Loss of metadata vdev means loss of entire pool - redundancy is critical!</li>
          </ul>
        </div>

        <div class="feature-card">
          <h3>RAM Requirements</h3>
          <p>ZFS is memory-intensive and benefits greatly from adequate RAM:</p>
          <ul>
            <li><strong>Basic:</strong> 1 GB per TB of raw storage (minimum 8 GB)</li>
            <li><strong>Deduplication:</strong> 5 GB per TB (minimum 16 GB)</li>
            <li><strong>Recommendation:</strong> More is always better for ZFS</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>Storage Units Explained</h2>
      </div>

      <div class="units-explanation">
        <p>Storage manufacturers use decimal units (powers of 10) while computers use binary units (powers of 2):</p>

        <div class="units-comparison">
          <div class="units-column">
            <h4>Decimal (TB - Terabyte)</h4>
            <ul>
              <li>1 TB = 1,000 GB</li>
              <li>1 GB = 1,000 MB</li>
              <li>Used by drive manufacturers</li>
              <li>Marketing and labeling</li>
            </ul>
          </div>

          <div class="units-column">
            <h4>Binary (TiB - Tebibyte)</h4>
            <ul>
              <li>1 TiB = 1,024 GiB</li>
              <li>1 GiB = 1,024 MiB</li>
              <li>Used by operating systems</li>
              <li>Actual usable space</li>
            </ul>
          </div>
        </div>

        <div class="conversion-note">
          <strong>Conversion:</strong> 1 TB ≈ 0.909 TiB | 1 TiB ≈ 1.099 TB
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const raidTypes = [
  {
    id: 'stripe',
    name: 'Stripe',
    badge: 'High Risk',
    badgeClass: 'warning',
    description: 'Data striped across drives with no redundancy. Maximum performance and capacity.',
    minDrives: 1,
    faultTolerance: '0 drives (no redundancy)',
    readSpeed: 'Excellent',
    writeSpeed: 'Excellent',
    recommendation: 'Only suitable for non-critical data or when backed by other redundancy mechanisms.'
  },
  {
    id: 'mirror',
    name: 'Mirror (RAID1/10)',
    badge: 'High Safety',
    badgeClass: 'success',
    description: 'Full copies of data across multiple drives. Maximum redundancy and read performance.',
    minDrives: 2,
    faultTolerance: 'N-1 drives',
    readSpeed: 'Excellent',
    writeSpeed: 'Good',
    recommendation: 'Ideal for high-performance workloads, critical data, and when capacity efficiency is not the primary concern.'
  },
  {
    id: 'raidz1',
    name: 'RAIDZ1',
    badge: 'Balanced',
    badgeClass: 'info',
    description: 'Single parity with variable stripe width. Good balance of capacity, protection, and performance.',
    minDrives: 3,
    optimalDrives: '3-9',
    faultTolerance: '1 drive',
    readSpeed: 'Good',
    writeSpeed: 'Fair',
    recommendation: 'Suitable for home and small business use. Minimum 3 drives required, optimal with 3-9 drives per vdev.'
  },
  {
    id: 'raidz2',
    name: 'RAIDZ2',
    badge: 'Recommended',
    badgeClass: 'success',
    description: 'Double parity with variable stripe width. Excellent protection with good capacity efficiency.',
    minDrives: 4,
    optimalDrives: '6-10',
    faultTolerance: '2 drives',
    readSpeed: 'Good',
    writeSpeed: 'Fair',
    recommendation: 'Recommended for most production environments. Minimum 4 drives, optimal with 6-10 drives per vdev. Best balance of safety and efficiency.'
  },
  {
    id: 'raidz3',
    name: 'RAIDZ3',
    badge: 'Maximum Safety',
    badgeClass: 'success',
    description: 'Triple parity with variable stripe width. Maximum protection for critical data and large arrays.',
    minDrives: 5,
    optimalDrives: '9-15',
    faultTolerance: '3 drives',
    readSpeed: 'Good',
    writeSpeed: 'Fair',
    recommendation: 'Best for large archives, critical data, and when maximum protection is required. Optimal with 9-15 drives per vdev.'
  }
]

const terminology = [
  {
    term: 'vdev (Virtual Device)',
    definition: 'A group of physical drives that form a single redundant unit. All drives in a vdev must be the same size. The pool is the sum of all vdevs, but is limited by the smallest vdev\'s capacity.'
  },
  {
    term: 'Slop Space',
    definition: 'ZFS reserves 1/32 of the pool capacity (minimum 128 MiB, maximum 50%) to prevent fragmentation and allow for in-place block rewrites. This space is automatically managed and not available for user data.'
  },
  {
    term: 'Parity',
    definition: 'Redundant data used to reconstruct lost information if drives fail. RAIDZ1 uses 1 parity drive worth of space, RAIDZ2 uses 2, and RAIDZ3 uses 3. Mirrors store complete copies.'
  },
  {
    term: 'ARC (Adaptive Replacement Cache)',
    definition: 'ZFS\'s in-memory cache that stores frequently and recently accessed data. More RAM means better performance. This is why ZFS is considered "RAM hungry".'
  },
  {
    term: 'Metadata Overhead',
    definition: 'Space used by ZFS to store filesystem metadata, checksums, and structural information. Typically 1-2% of total capacity.'
  },
  {
    term: 'Stripe Width',
    definition: 'The number of data drives in a RAIDZ vdev (total drives minus parity drives). Wider stripes generally mean better performance but less flexibility in vdev expansion.'
  }
]
</script>

<style scoped>
.educational-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 3px solid var(--border-color);
}

.raid-types {
  display: grid;
  gap: 1.5rem;
  margin-top: 1rem;
}

.raid-type-card {
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-color);
}

.raid-type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.raid-type-header h3 {
  margin: 0;
}

.description {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.spec-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background-color: var(--card-bg);
  border-radius: 4px;
  font-size: 0.9rem;
}

.spec-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.spec-value {
  font-weight: 600;
}

.recommendation {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: rgba(76, 175, 80, 0.1);
  border-left: 4px solid var(--secondary-color);
  border-radius: 4px;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.terminology-grid {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.term-item {
  padding: 1rem;
  background-color: var(--bg-color);
  border-radius: 4px;
  border-left: 3px solid var(--primary-color);
}

.term-item h4 {
  margin-bottom: 0.5rem;
  color: var(--primary-color);
}

.term-item p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr; /* Mobile: 1 column (4 rows) */
  gap: 1.5rem;
  margin-top: 1rem;
}

/* Tablet: 2 columns (2 rows of 2) */
@media (min-width: 768px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 4 columns (1 row of 4) */
@media (min-width: 1200px) {
  .features-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.feature-card {
  padding: 1.5rem;
  background-color: var(--bg-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.feature-card h3 {
  margin-bottom: 0.75rem;
  color: var(--primary-color);
}

.feature-card p {
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

.feature-card ul {
  margin: 0;
  padding-left: 1.5rem;
}

.feature-card li {
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.units-explanation {
  margin-top: 1rem;
}

.units-explanation > p {
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
}

.units-comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.units-column h4 {
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.units-column ul {
  padding-left: 1.5rem;
}

.units-column li {
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}

.conversion-note {
  padding: 1rem;
  background-color: rgba(255, 152, 0, 0.1);
  border-left: 4px solid var(--warning-color);
  border-radius: 4px;
  text-align: center;
  color: var(--text-primary);
}
</style>
