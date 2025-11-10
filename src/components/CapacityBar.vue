<template>
  <div class="capacity-bar-container">
    <div class="capacity-bar">
      <div
        v-if="reserved > 0"
        class="bar-segment reserved"
        :style="{ width: `${reservedPercent}%` }"
        :title="`Reserved: ${reserved.toFixed(2)} TB`"
      >
        <span v-if="reservedPercent > 8" class="segment-label">{{ reserved.toFixed(1) }} TB</span>
      </div>
      <div
        v-if="available > 0"
        class="bar-segment available"
        :style="{ width: `${availablePercent}%` }"
        :title="`Available: ${available.toFixed(2)} TB`"
      >
        <span v-if="availablePercent > 8" class="segment-label">{{ available.toFixed(1) }} TB</span>
      </div>
      <div
        v-if="parity > 0"
        class="bar-segment parity"
        :style="{ width: `${parityPercent}%` }"
        :title="`Parity/Protection: ${parity.toFixed(2)} TB`"
      >
        <span v-if="parityPercent > 8" class="segment-label">{{ parity.toFixed(1) }} TB</span>
      </div>
      <div
        v-if="unused > 0"
        class="bar-segment unused"
        :style="{ width: `${unusedPercent}%` }"
        :title="`Unused: ${unused.toFixed(2)} TB`"
      >
        <span v-if="unusedPercent > 5" class="segment-label">{{ unused.toFixed(1) }} TB</span>
      </div>
    </div>

    <div class="capacity-legend">
      <div class="legend-item">
        <span class="legend-color reserved"></span>
        <span>Reserved capacity for system</span>
      </div>
      <div class="legend-item">
        <span class="legend-color available"></span>
        <span>Available capacity</span>
      </div>
      <div class="legend-item">
        <span class="legend-color parity"></span>
        <span>Protection</span>
      </div>
      <div class="legend-item">
        <span class="legend-color unused"></span>
        <span>Unused space</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: { type: Number, required: true },
  reserved: { type: Number, default: 0 },
  available: { type: Number, required: true },
  parity: { type: Number, default: 0 },
  unused: { type: Number, default: 0 }
})

const reservedPercent = computed(() => (props.reserved / props.total) * 100)
const availablePercent = computed(() => (props.available / props.total) * 100)
const parityPercent = computed(() => (props.parity / props.total) * 100)
const unusedPercent = computed(() => (props.unused / props.total) * 100)
</script>

<style scoped>
.capacity-bar-container {
  margin: 1.5rem 0;
}

.capacity-bar {
  display: flex;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  position: relative;
}

.bar-segment:hover {
  filter: brightness(1.1);
}

.bar-segment.reserved {
  background-color: var(--capacity-reserved);
}

.bar-segment.available {
  background-color: var(--capacity-available);
}

.bar-segment.parity {
  background-color: var(--capacity-parity);
}

.bar-segment.unused {
  background-color: var(--capacity-unused);
}

.segment-label {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.capacity-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
  font-size: 0.85rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.legend-color.reserved {
  background-color: var(--capacity-reserved);
}

.legend-color.available {
  background-color: var(--capacity-available);
}

.legend-color.parity {
  background-color: var(--capacity-parity);
}

.legend-color.unused {
  background-color: var(--capacity-unused);
}
</style>
