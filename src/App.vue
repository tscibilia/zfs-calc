<template>
  <div class="container">
    <header class="header">
      <h1>ZFS Storage Calculator</h1>
      <p class="text-muted">Plan your ZFS storage pool with accurate capacity calculations</p>
    </header>

    <div class="calculator-layout">
      <!-- Configuration Panel -->
      <div class="config-panel">
        <div class="card">
          <div class="card-header">
            <h2>Storage Configuration</h2>
          </div>

          <!-- Vdev Groups -->
          <div class="vdev-groups">
            <div v-for="(vdev, index) in vdevs" :key="vdev.id" class="vdev-group-container">
              <VdevGroup
                :vdev="vdev"
                :index="index"
                @update="updateVdev"
                @remove="removeVdev"
              />
            </div>
          </div>

          <button @click="addVdev" class="primary" style="width: 100%;">
            + Add vdev Group
          </button>
        </div>

        <!-- Optional Devices -->
        <div class="card">
          <div class="card-header">
            <h3>Optional Devices</h3>
          </div>

          <!-- ZIL/SLOG -->
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="config.useZIL" />
              Add ZIL/SLOG (Separate Intent Log)
            </label>
            <div v-if="config.useZIL" class="optional-device-config">
              <div class="grid grid-2">
                <div class="form-group">
                  <label>ZIL Size (GB)</label>
                  <input type="number" v-model.number="config.zilSizeGb" min="8" />
                  <span class="text-small text-muted">Recommended: {{ recommendedZILSize }} GB</span>
                </div>
                <div class="form-group">
                  <label>Redundancy</label>
                  <select v-model="config.zilRedundancy">
                    <option value="single">Single Device</option>
                    <option value="mirror">Mirrored Pair</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- L2ARC -->
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="config.useL2ARC" />
              Add L2ARC (Read Cache)
            </label>
            <div v-if="config.useL2ARC" class="optional-device-config">
              <div class="grid grid-2">
                <div class="form-group">
                  <label>L2ARC Size (GB)</label>
                  <input type="number" v-model.number="config.l2arcSizeGb" min="16" />
                  <span class="text-small text-muted">Recommended: {{ recommendedL2ARCSize }} GB</span>
                </div>
                <div class="form-group">
                  <label>Number of Devices</label>
                  <input type="number" v-model.number="config.l2arcDevices" min="1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RAM Configuration -->
        <div class="card">
          <div class="card-header">
            <h3>RAM Recommendations</h3>
          </div>
          <div class="form-group">
            <label>Usage Scenario</label>
            <select v-model="config.ramScenario">
              <option value="basic">Basic NAS (1 GB / TB)</option>
              <option value="dedup">Deduplication (5 GB / TB)</option>
            </select>
          </div>
          <div class="ram-recommendation">
            <strong>Recommended RAM:</strong> {{ recommendedRAM }} GB
            <span class="text-small text-muted">(minimum {{ config.ramScenario === 'dedup' ? '16' : '8' }} GB)</span>
          </div>
        </div>
      </div>

      <!-- Results Panel -->
      <div class="results-panel">
        <ResultsPanel :results="calculationResults" :vdevs="vdevs" :config="config" />
      </div>
    </div>

    <!-- Educational Content -->
    <EducationalContent />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import VdevGroup from './components/VdevGroup.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import EducationalContent from './components/EducationalContent.vue'
import {
  calculatePoolCapacity,
  calculateRecommendedRAM,
  calculateZILSize,
  calculateL2ARCSize
} from './zfsCalculations.js'

// State
const vdevs = ref([])
const nextVdevId = ref(1)

const config = ref({
  useZIL: false,
  zilSizeGb: 16,
  zilRedundancy: 'mirror',
  useL2ARC: false,
  l2arcSizeGb: 64,
  l2arcDevices: 1,
  ramScenario: 'basic'
})

// Initialize with one vdev
const addVdev = () => {
  vdevs.value.push({
    id: nextVdevId.value++,
    raidType: 'raidz2',
    drives: [
      { id: 1, capacityTb: 4 }
    ],
    nextDriveId: 2
  })
}

const updateVdev = (index, updatedVdev) => {
  vdevs.value[index] = updatedVdev
}

const removeVdev = (index) => {
  vdevs.value.splice(index, 1)
}

// Calculations
const calculationResults = computed(() => {
  return calculatePoolCapacity(vdevs.value)
})

const recommendedRAM = computed(() => {
  return calculateRecommendedRAM(
    calculationResults.value.totalRawTb,
    config.value.ramScenario === 'dedup'
  )
})

const recommendedZILSize = computed(() => {
  return calculateZILSize(recommendedRAM.value)
})

const recommendedL2ARCSize = computed(() => {
  return calculateL2ARCSize(recommendedRAM.value)
})

// URL Parameter Support
const serializeConfig = () => {
  const data = {
    vdevs: vdevs.value.map(v => ({
      r: v.raidType,
      d: v.drives.map(d => d.capacityTb)
    })),
    zil: config.value.useZIL ? `${config.value.zilSizeGb}:${config.value.zilRedundancy}` : null,
    l2arc: config.value.useL2ARC ? `${config.value.l2arcSizeGb}x${config.value.l2arcDevices}` : null,
    ram: config.value.ramScenario
  }
  return encodeURIComponent(JSON.stringify(data))
}

const deserializeConfig = (str) => {
  try {
    const data = JSON.parse(decodeURIComponent(str))

    if (data.vdevs) {
      vdevs.value = data.vdevs.map((v, idx) => ({
        id: idx + 1,
        raidType: v.r,
        drives: v.d.map((cap, dIdx) => ({ id: dIdx + 1, capacityTb: cap })),
        nextDriveId: v.d.length + 1
      }))
      nextVdevId.value = data.vdevs.length + 1
    }

    if (data.zil) {
      const [size, redundancy] = data.zil.split(':')
      config.value.useZIL = true
      config.value.zilSizeGb = parseInt(size)
      config.value.zilRedundancy = redundancy
    }

    if (data.l2arc) {
      const [size, devices] = data.l2arc.split('x')
      config.value.useL2ARC = true
      config.value.l2arcSizeGb = parseInt(size)
      config.value.l2arcDevices = parseInt(devices)
    }

    if (data.ram) {
      config.value.ramScenario = data.ram
    }
  } catch (e) {
    console.error('Failed to deserialize config:', e)
  }
}

// Update URL when config changes
watch([vdevs, config], () => {
  const serialized = serializeConfig()
  const url = new URL(window.location)
  url.searchParams.set('config', serialized)
  window.history.replaceState({}, '', url)
}, { deep: true })

// Load from URL on mount
const loadFromURL = () => {
  const params = new URLSearchParams(window.location.search)
  const configParam = params.get('config')

  if (configParam) {
    deserializeConfig(configParam)
  } else {
    // Default: add one vdev
    addVdev()
  }
}

loadFromURL()
</script>

<style scoped>
.header {
  text-align: center;
  margin-bottom: 2rem;
}

.calculator-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 1024px) {
  .calculator-layout {
    grid-template-columns: 1fr;
  }
}

.config-panel,
.results-panel {
  min-height: 200px;
}

.vdev-groups {
  margin-bottom: 1rem;
}

.vdev-group-container {
  margin-bottom: 1rem;
}

.optional-device-config {
  margin-top: 0.5rem;
  padding: 1rem;
  background-color: var(--bg-color);
  border-radius: 4px;
}

.ram-recommendation {
  padding: 1rem;
  background-color: #e3f2fd;
  border-radius: 4px;
  border-left: 4px solid var(--primary-color);
}

input[type="checkbox"] {
  width: auto;
  margin-right: 0.5rem;
}
</style>
