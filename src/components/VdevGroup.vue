<template>
  <div class="vdev-group" :class="{ 'has-error': hasErrors }">
    <div class="vdev-header">
      <h4>vdev {{ index + 1 }}</h4>
      <button @click="$emit('remove', index)" class="danger" v-if="index > 0 || true">Remove</button>
    </div>

    <div class="form-group">
      <label>RAID Type</label>
      <select v-model="localVdev.raidType" @change="onRaidTypeChange">
        <option value="stripe">Stripe (No Redundancy)</option>
        <option value="mirror">Mirror</option>
        <option value="raidz1">RAIDZ1 (Single Parity)</option>
        <option value="raidz2">RAIDZ2 (Double Parity)</option>
        <option value="raidz3">RAIDZ3 (Triple Parity)</option>
      </select>
    </div>

    <!-- Drives -->
    <div class="drives-section">
      <div class="drives-header">
        <label>Drives ({{ localVdev.drives.length }})</label>
        <span class="text-muted text-small">All drives in a vdev must be the same size</span>
      </div>

      <div class="drives-grid">
        <div
          v-for="(drive, dIdx) in localVdev.drives"
          :key="drive.id"
          class="drive-item"
        >
          <div class="drive-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div class="drive-controls">
            <input
              type="number"
              v-model.number="drive.capacityTb"
              @input="updateDriveSize(dIdx, $event)"
              min="0.5"
              step="0.5"
              placeholder="Size"
            />
            <span class="drive-unit">TB</span>
          </div>
          <button
            @click="removeDrive(dIdx)"
            class="remove-drive-btn"
            v-if="localVdev.drives.length > minDrives"
            title="Remove drive"
          >
            ×
          </button>
        </div>

        <!-- Add Drive Button -->
        <div class="drive-item add-drive" @click="addDrive">
          <div class="drive-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <div class="add-drive-label">Add Drive</div>
        </div>
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

const addDrive = () => {
  const firstDriveSize = localVdev.value.drives[0]?.capacityTb || 4
  localVdev.value.drives.push({
    id: localVdev.value.nextDriveId++,
    capacityTb: firstDriveSize
  })
}

const removeDrive = (index) => {
  if (localVdev.value.drives.length > minDrives.value) {
    localVdev.value.drives.splice(index, 1)
  }
}

const updateDriveSize = (index, event) => {
  const newSize = parseFloat(event.target.value)
  if (!isNaN(newSize) && newSize > 0) {
    // Update all drives to match (same size in vdev)
    localVdev.value.drives.forEach(drive => {
      drive.capacityTb = newSize
    })
  }
}

const onRaidTypeChange = () => {
  // Ensure minimum drives for raid type
  const min = minDrives.value
  while (localVdev.value.drives.length < min) {
    addDrive()
  }
}
</script>

<style scoped>
.vdev-group {
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
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
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.vdev-header h4 {
  margin: 0;
  text-transform: uppercase;
  font-size: 0.9rem;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
}

.drives-section {
  margin: 1rem 0;
}

.drives-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.drives-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.drive-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-color);
  transition: all 0.2s;
}

.drive-item:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.drive-icon {
  color: var(--primary-color);
}

.drive-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
}

.drive-controls input {
  flex: 1;
  text-align: center;
  min-width: 0;
}

.drive-unit {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 600;
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
}

.add-drive {
  cursor: pointer;
  border-style: dashed;
  opacity: 0.7;
}

.add-drive:hover {
  opacity: 1;
  background-color: var(--card-bg);
}

.add-drive-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.validation-errors {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #ffebee;
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
  background-color: #e8f5e9;
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
