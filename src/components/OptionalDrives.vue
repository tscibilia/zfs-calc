<template>
  <div class="optional-drives">
    <div class="drive-bay">
      <div
        v-for="(drive, index) in drives"
        :key="index"
        class="drive-slot filled"
      >
        <div class="drive-icon-container">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div class="drive-info">
          <span class="drive-size">{{ drive.sizeGb }} GB</span>
          <span class="drive-type-label">{{ type }}</span>
        </div>
        <button
          v-if="drives.length > 1"
          @click="$emit('remove', index)"
          class="remove-drive-btn"
          title="Remove drive"
        >
          ×
        </button>
      </div>

      <div
        v-if="canAddMore"
        class="drive-slot empty"
        @click="$emit('add')"
        title="Add drive"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <span class="add-label">Add Drive</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  drives: { type: Array, required: true },
  type: { type: String, required: true },
  maxDrives: { type: Number, default: 4 }
})

defineEmits(['add', 'remove'])

const canAddMore = computed(() => props.drives.length < props.maxDrives)
</script>

<style scoped>
.optional-drives {
  margin-top: 1rem;
}

.drive-bay {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background-color: var(--drive-bay-bg);
  border-radius: 8px;
  overflow-x: auto;
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
  padding: 1rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.drive-slot.filled {
  background-color: var(--drive-bg);
  color: var(--drive-text);
}

.drive-slot.empty {
  background-color: transparent;
  border: 2px dashed var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
}

.drive-slot.empty:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.drive-icon-container {
  color: var(--drive-text);
}

.drive-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
}

.drive-size {
  font-weight: 600;
  font-size: 0.95rem;
}

.drive-type-label {
  font-size: 0.75rem;
  opacity: 0.8;
  text-transform: uppercase;
}

.add-label {
  font-size: 0.85rem;
  margin-top: 0.25rem;
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
</style>
