<template>
  <div class="drive-size-selector">
    <div class="size-buttons">
      <button
        v-for="size in commonSizes"
        :key="size"
        @click="$emit('select', size)"
        class="size-button"
        :class="{ 'selected': selectedSize === size }"
      >
        {{ size }} TB
        <span v-if="selectedSize === size" class="check-mark">✓</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  selectedSize: Number
})

defineEmits(['select'])

const commonSizes = [24, 20, 18, 16, 14, 12, 10, 8, 6, 4, 3, 2, 1, 0.5]
</script>

<style scoped>
.drive-size-selector {
  margin-bottom: 1rem;
}

.size-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 0.5rem;
}

.size-button {
  position: relative;
  padding: 0.75rem 0.5rem;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.size-button:hover {
  background-color: var(--bg-color);
  border-color: var(--primary-color);
}

.size-button.selected {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.check-mark {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 0.8rem;
}
</style>
