<template>
  <div class="vdev-group" :class="{ 'has-error': hasErrors }">
    <div class="vdev-header">
      <div class="header-left">
        <h4>vdev {{ index + 1 }}</h4>
        <select v-model="localVdev.raidType" @change="onRaidTypeChange" class="raid-type-select">
          <option value="stripe">Stripe</option>
          <option value="mirror">Mirror</option>
          <option value="raidz1">RAIDZ1</option>
          <option value="raidz2">RAIDZ2</option>
          <option value="raidz3">RAIDZ3</option>
        </select>
      </div>
      <button @click="$emit('remove', index)" class="danger small-btn">Remove</button>
    </div>

    <!-- Drive Size Selector -->
    <div class="size-selector-section">
      <label class="section-label">Select drive size:</label>
      <DriveSizeSelector
        :selected-size="currentDriveSize"
        @select="onDriveSizeSelect"
      />
    </div>

    <!-- Drive Bay -->
    <div class="drives-section">
      <div class="drives-header">
        <span class="drive-count">{{ localVdev.drives.length }} drive{{ localVdev.drives.length !== 1 ? 's' : '' }}</span>
        <button @click="resetDrives" class="text-button">Reset</button>
      </div>

      <div class="drive-bay">
        <div
          v-for="(drive, dIdx) in localVdev.drives"
          :key="drive.id"
          class="drive-slot filled"
        >
          <div class="drive-icon-container">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div class="drive-capacity">{{ drive.capacityTb }} TB</div>
          <button
            @click="removeDrive(dIdx)"
            class="remove-drive-btn"
            v-if="localVdev.drives.length > minDrives"
            title="Remove drive"
          >
            ×
          </button>
        </div>

        <!-- Empty slots for visual effect (up to 8 slots total) -->
        <div
          v-for="n in Math.min(8 - localVdev.drives.length, 4)"
          :key="`empty-${n}`"
          class="drive-slot empty"
        ></div>
      </div>
    </div>

    <!-- Validation Errors -->
    <div v-if="validationErrors.length > 0" class="validation-errors">
      <div v-for="error in validationErrors" :key="error" class="error-message">
        {{ error }}
      </div>
    </div>

    <!-- vdev Summary -->
    <div class="vdev-summary" v-if="vdevCapacity">
      <div class="summary-item">
        <span class="label">Raw Capacity:</span>
        <span class="value">{{ vdevCapacity.rawTb.toFixed(2) }} TB ({{ vdevCapacity.rawTib.toFixed(2) }} TiB)</span>
      </div>
      <div class="summary-item">
        <span class="label">Usable Capacity:</span>
        <span class="value">{{ vdevCapacity.usableTb.toFixed(2) }} TB ({{ vdevCapacity.usableTib.toFixed(2) }} TiB)</span>
      </div>
      <div class="summary-item">
        <span class="label">Efficiency:</span>
        <span class="value">{{ ((vdevCapacity.usableTb / vdevCapacity.rawTb) * 100).toFixed(1) }}%</span>
      </div>
      <div class="summary-item">
        <span class="label">Fault Tolerance:</span>
        <span class="value">{{ faultTolerance }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import DriveSizeSelector from './DriveSizeSelector.vue'
import { calculateVdevCapacity, validateVdev, getRaidTypeInfo } from '../zfsCalculations.js'

const props = defineProps({
  vdev: Object,
  index: Number
})

const emit = defineEmits(['update', 'remove'])

const localVdev = ref({ ...props.vdev })

// Update parent when local changes
watch(localVdev, (newVal) => {
  emit('update', props.index, newVal)
}, { deep: true })

// Sync props to local
watch(() => props.vdev, (newVal) => {
  localVdev.value = { ...newVal }
}, { deep: true })

const raidInfo = computed(() => getRaidTypeInfo(localVdev.value.raidType))

const minDrives = computed(() => raidInfo.value.minDrives)

const validationErrors = computed(() => {
  return validateVdev(localVdev.value.raidType, localVdev.value.drives.length)
})

const hasErrors = computed(() => validationErrors.value.length > 0)

const vdevCapacity = computed(() => {
  if (localVdev.value.drives.length === 0) return null
  return calculateVdevCapacity(
    localVdev.value.raidType,
    localVdev.value.drives[0].capacityTb,
    localVdev.value.drives.length
  )
})

const faultTolerance = computed(() => {
  const info = raidInfo.value
  if (typeof info.faultTolerance === 'number') {
    return `${info.faultTolerance} drive${info.faultTolerance > 1 ? 's' : ''}`
  }
  return info.faultTolerance
})

const currentDriveSize = computed(() => {
  return localVdev.value.drives[0]?.capacityTb || null
})

const onDriveSizeSelect = (size) => {
  if (localVdev.value.drives.length === 0) {
    // Add first drive with selected size
    localVdev.value.drives.push({
      id: localVdev.value.nextDriveId++,
      capacityTb: size
    })
  } else {
    // Add another drive with same size
    localVdev.value.drives.push({
      id: localVdev.value.nextDriveId++,
      capacityTb: size
    })
    // Update all drives to this size
    localVdev.value.drives.forEach(drive => {
      drive.capacityTb = size
    })
  }

  // Ensure minimum drives for raid type
  onRaidTypeChange()
}

const removeDrive = (index) => {
  if (localVdev.value.drives.length > minDrives.value) {
    localVdev.value.drives.splice(index, 1)
  }
}

const resetDrives = () => {
  localVdev.value.drives = []
}

const onRaidTypeChange = () => {
  // Ensure minimum drives for raid type
  const min = minDrives.value
  const currentSize = localVdev.value.drives[0]?.capacityTb || 4
  while (localVdev.value.drives.length < min) {
    localVdev.value.drives.push({
      id: localVdev.value.nextDriveId++,
      capacityTb: currentSize
    })
  }
}
</script>

<style scoped>
.vdev-group {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  background-color: var(--card-bg);
  transition: border-color 0.2s;
}

.vdev-group.has-error {
  border-color: var(--danger-color);
}

.vdev-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.vdev-header h4 {
  margin: 0;
  text-transform: uppercase;
  font-size: 0.85rem;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
  font-weight: 700;
}

.raid-type-select {
  padding: 0.4rem 0.75rem;
  font-size: 0.9rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--card-bg);
  color: var(--text-primary);
}

.small-btn {
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
}

.size-selector-section {
  margin-bottom: 1.5rem;
}

.section-label {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.drives-section {
  margin-bottom: 1rem;
}

.drives-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.drive-count {
  color: var(--text-secondary);
}

.text-button {
  background: none;
  border: none;
  color: var(--primary-color);
  padding: 0;
  font-size: 0.9rem;
  text-decoration: underline;
  cursor: pointer;
}

.text-button:hover {
  color: var(--primary-dark);
  transform: none;
  box-shadow: none;
}

.drive-bay {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  background-color: var(--drive-bay-bg);
  border-radius: 8px;
  overflow-x: auto;
  min-height: 140px;
  flex-wrap: wrap;
}

.drive-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 100px;
  padding: 1rem 0.75rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.drive-slot.filled {
  background-color: var(--drive-bg);
  color: var(--drive-text);
}

.drive-slot.empty {
  background-color: transparent;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  opacity: 0.4;
}

.drive-icon-container {
  color: var(--drive-text);
}

.drive-capacity {
  font-weight: 700;
  font-size: 1rem;
  color: var(--drive-text);
}

.remove-drive-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 50%;
  background-color: var(--danger-color);
  color: white;
  font-size: 1.2rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--drive-bay-bg);
}

.remove-drive-btn:hover {
  transform: scale(1.1);
}

.validation-errors {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: rgba(244, 67, 54, 0.1);
  border-left: 4px solid var(--danger-color);
  border-radius: 4px;
}

.error-message {
  color: var(--danger-color);
  font-size: 0.9rem;
  font-weight: 500;
}

.vdev-summary {
  margin-top: 1rem;
  padding: 1rem;
  background-color: rgba(76, 175, 80, 0.1);
  border-radius: 4px;
  border-left: 4px solid var(--secondary-color);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item .label {
  color: var(--text-secondary);
  font-weight: 500;
}

.summary-item .value {
  font-weight: 600;
  color: var(--text-primary);
}
</style>
