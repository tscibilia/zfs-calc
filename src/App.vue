<template>
  <div class="app-container">
    <!-- Header with Dark Mode Toggle -->
    <header class="header">
      <div class="header-content">
        <div>
          <h1>ZFS Storage Calculator</h1>
          <p class="text-muted">Plan your ZFS storage pool with accurate capacity calculations</p>
        </div>
        <button @click="toggleTheme" class="theme-toggle" title="Toggle dark mode">
          <svg v-if="theme === 'dark'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </div>
    </header>

    <div class="container">
      <div class="calculator-layout">
        <!-- Configuration Panel -->
        <div class="config-panel">
          <!-- Data vdevs -->
          <div class="card">
            <div class="card-header">
              <h2>ZFS Pool Configuration</h2>
            </div>

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
              + Add Another vdev Group
            </button>
          </div>

          <!-- Optional Devices -->
          <div class="card">
            <div class="card-header">
              <h3>Optional Devices</h3>
            </div>

            <!-- ZIL/SLOG -->
            <div class="optional-device-section">
              <label class="device-checkbox">
                <input type="checkbox" v-model="config.useZIL" />
                <div>
                  <strong>ZIL/SLOG (Separate Intent Log)</strong>
                  <p class="text-small text-muted">Fast SSDs for sync write performance</p>
                </div>
              </label>

              <div v-if="config.useZIL" class="device-config">
                <div class="form-row">
                  <div class="form-group">
                    <label>Size per Device (GB)</label>
                    <input type="number" v-model.number="config.zilSizeGb" min="8" />
                    <span class="text-small text-muted">Recommended: {{ recommendedZILSize }} GB</span>
                  </div>
                  <div class="form-group">
                    <label>Configuration</label>
                    <select v-model="config.zilRedundancy">
                      <option value="single">Single Device</option>
                      <option value="mirror">Mirrored Pair</option>
                    </select>
                  </div>
                </div>

                <OptionalDrives
                  :drives="zilDrives"
                  type="ZIL/SLOG"
                  :max-drives="config.zilRedundancy === 'mirror' ? 2 : 1"
                  @add="addZILDrive"
                  @remove="removeZILDrive"
                />
              </div>
            </div>

            <!-- L2ARC -->
            <div class="optional-device-section">
              <label class="device-checkbox">
                <input type="checkbox" v-model="config.useL2ARC" />
                <div>
                  <strong>L2ARC (Read Cache)</strong>
                  <p class="text-small text-muted">SSDs for extended read caching</p>
                </div>
              </label>

              <div v-if="config.useL2ARC" class="device-config">
                <div class="form-group">
                  <label>Size per Device (GB)</label>
                  <input type="number" v-model.number="config.l2arcSizeGb" min="16" />
                  <span class="text-small text-muted">Recommended: {{ recommendedL2ARCSize }} GB</span>
                </div>

                <OptionalDrives
                  :drives="l2arcDrives"
                  type="L2ARC"
                  :max-drives="4"
                  @add="addL2ARCDrive"
                  @remove="removeL2ARCDrive"
                />
              </div>
            </div>

            <!-- Metadata vdev -->
            <div class="optional-device-section">
              <label class="device-checkbox">
                <input type="checkbox" v-model="config.useMetadataVdev" />
                <div>
                  <strong>Special Metadata vdev</strong>
                  <p class="text-small text-muted">Dedicated SSDs for metadata and small blocks</p>
                </div>
              </label>

              <div v-if="config.useMetadataVdev" class="device-config">
                <div class="form-row">
                  <div class="form-group">
                    <label>Size per Device (GB)</label>
                    <input type="number" v-model.number="config.metadataVdevSizeGb" min="32" />
                    <span class="text-small text-muted">Typical: 10-20% of data pool size</span>
                  </div>
                  <div class="form-group">
                    <label>Configuration</label>
                    <select v-model="config.metadataVdevRedundancy">
                      <option value="mirror">Mirrored Pair (Recommended)</option>
                      <option value="mirror3">3-way Mirror</option>
                    </select>
                  </div>
                </div>

                <OptionalDrives
                  :drives="metadataVdevDrives"
                  type="Metadata"
                  :max-drives="config.metadataVdevRedundancy === 'mirror3' ? 3 : 2"
                  @add="addMetadataVdevDrive"
                  @remove="removeMetadataVdevDrive"
                />
              </div>
            </div>
          </div>

          <!-- RAM Configuration -->
          <div class="card compact">
            <div class="form-group">
              <label>RAM Scenario</label>
              <select v-model="config.ramScenario">
                <option value="basic">Basic NAS (1 GB / TB)</option>
                <option value="dedup">Deduplication (5 GB / TB)</option>
              </select>
            </div>
            <div class="ram-recommendation">
              <strong>Recommended RAM:</strong> {{ recommendedRAM }} GB
            </div>

            <div class="form-group" style="margin-top: 1rem;">
              <label class="device-checkbox">
                <input type="checkbox" v-model="config.reserveFreeSpace" />
                <div>
                  <strong>Reserve Free Space</strong>
                  <p class="text-small text-muted">Keep pool below capacity for performance</p>
                </div>
              </label>
              <div v-if="config.reserveFreeSpace" style="margin-left: 1.75rem; margin-top: 0.5rem;">
                <label>Percentage to Reserve</label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <input type="number" v-model.number="config.freeSpacePercent" min="5" max="50" step="5" style="width: 80px;" />
                  <span>%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Results Panel -->
        <div class="results-panel">
          <div class="card">
            <div class="card-header">
              <h2>Usage Estimate</h2>
            </div>

            <!-- Quick Summary -->
            <div class="quick-summary">
              <div class="summary-card primary-summary">
                <div class="summary-label">Available Capacity</div>
                <div class="summary-value">{{ results.zfsUsableTb.toFixed(2) }} TB</div>
                <div class="summary-sublabel">{{ results.zfsUsableTib.toFixed(2) }} TiB</div>
              </div>

              <div class="summary-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Raw:</span>
                  <span class="stat-value">{{ results.totalRawTb.toFixed(1) }} TB</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Efficiency:</span>
                  <span class="stat-value">{{ results.totalRawTb > 0 ? ((results.zfsUsableTb / results.totalRawTb * 100)).toFixed(1) : '0.0' }}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">vdevs:</span>
                  <span class="stat-value">{{ vdevs.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Drives:</span>
                  <span class="stat-value">{{ totalDrives }}</span>
                </div>
              </div>
            </div>

            <!-- Capacity Bar -->
            <CapacityBar
              v-if="results.totalRawTb > 0"
              :total="results.totalRawTb"
              :reserved="results.slopSpaceTb + results.metadataOverheadTb"
              :available="results.zfsUsableTb"
              :parity="results.parityOverheadTb"
              :unused="config.reserveFreeSpace ? (results.totalRawTb * (config.freeSpacePercent / 100)) : 0"
            />

            <!-- Detailed Table -->
            <details class="detailed-breakdown">
              <summary>Detailed Capacity Breakdown</summary>
              <div class="breakdown-table">
                <div class="breakdown-row">
                  <span>Total Raw Capacity</span>
                  <span>{{ results.totalRawTb.toFixed(2) }} TB</span>
                </div>
                <div class="breakdown-row indent">
                  <span>Parity & Padding</span>
                  <span>-{{ results.parityOverheadTb.toFixed(2) }} TB</span>
                </div>
                <div class="breakdown-row">
                  <span>Zpool Capacity</span>
                  <span>{{ results.zpoolCapacityTb.toFixed(2) }} TB</span>
                </div>
                <div class="breakdown-row indent">
                  <span>Slop Space</span>
                  <span>-{{ results.slopSpaceTb.toFixed(2) }} TB</span>
                </div>
                <div class="breakdown-row indent">
                  <span>Metadata</span>
                  <span>-{{ results.metadataOverheadTb.toFixed(2) }} TB</span>
                </div>
                <div class="breakdown-row highlight">
                  <span><strong>ZFS Usable</strong></span>
                  <span><strong>{{ results.zfsUsableTb.toFixed(2) }} TB</strong></span>
                </div>
                <div v-if="config.reserveFreeSpace" class="breakdown-row indent">
                  <span>Free Space Reserved ({{ config.freeSpacePercent }}%)</span>
                  <span>-{{ (results.totalRawTb * (config.freeSpacePercent / 100)).toFixed(2) }} TB</span>
                </div>
                <div v-if="config.reserveFreeSpace" class="breakdown-row highlight">
                  <span><strong>Practical Usable</strong></span>
                  <span><strong>{{ (results.zfsUsableTb - (results.totalRawTb * (config.freeSpacePercent / 100))).toFixed(2) }} TB</strong></span>
                </div>
              </div>
            </details>

            <!-- Share Button -->
            <button @click="copyShareLink" class="primary" style="width: 100%; margin-top: 1rem;">
              {{ copied ? '✓ Link Copied!' : 'Copy Share Link' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Educational Content -->
      <EducationalContent />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import VdevGroup from './components/VdevGroup.vue'
import OptionalDrives from './components/OptionalDrives.vue'
import CapacityBar from './components/CapacityBar.vue'
import EducationalContent from './components/EducationalContent.vue'
import {
  calculatePoolCapacity,
  calculateRecommendedRAM,
  calculateZILSize,
  calculateL2ARCSize
} from './zfsCalculations.js'

// Theme management
const theme = ref('light')

const initTheme = () => {
  // Check localStorage first
  const savedTheme = localStorage.getItem('zfs-calc-theme')
  if (savedTheme) {
    theme.value = savedTheme
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme.value = 'dark'
  }
  applyTheme()
}

const applyTheme = () => {
  document.documentElement.setAttribute('data-theme', theme.value)
}

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('zfs-calc-theme', theme.value)
  applyTheme()
}

// State
const vdevs = ref([])
const nextVdevId = ref(1)
const copied = ref(false)

const config = ref({
  useZIL: false,
  zilSizeGb: 16,
  zilRedundancy: 'mirror',
  useL2ARC: false,
  l2arcSizeGb: 64,
  useMetadataVdev: false,
  metadataVdevSizeGb: 128,
  metadataVdevRedundancy: 'mirror',
  ramScenario: 'basic',
  reserveFreeSpace: true,
  freeSpacePercent: 20
})

// Optional drives state
const zilDrives = ref([])
const l2arcDrives = ref([])
const metadataVdevDrives = ref([])

// Initialize with one vdev
const addVdev = () => {
  const newVdev = {
    id: nextVdevId.value++,
    raidType: 'raidz2',
    drives: [],
    nextDriveId: 1
  }
  vdevs.value.push(newVdev)
}

const updateVdev = (index, updatedVdev) => {
  vdevs.value[index] = {
    ...updatedVdev,
    drives: updatedVdev.drives ? updatedVdev.drives.map(d => ({ ...d })) : []
  }
}

const removeVdev = (index) => {
  if (vdevs.value.length > 1) {
    vdevs.value.splice(index, 1)
  }
}

// ZIL/SLOG management
const addZILDrive = () => {
  const maxDrives = config.value.zilRedundancy === 'mirror' ? 2 : 1
  if (zilDrives.value.length < maxDrives) {
    zilDrives.value.push({ sizeGb: config.value.zilSizeGb })
  }
}

const removeZILDrive = (index) => {
  zilDrives.value.splice(index, 1)
}

// L2ARC management
const addL2ARCDrive = () => {
  if (l2arcDrives.value.length < 4) {
    l2arcDrives.value.push({ sizeGb: config.value.l2arcSizeGb })
  }
}

const removeL2ARCDrive = (index) => {
  l2arcDrives.value.splice(index, 1)
}

// Metadata vdev management
const addMetadataVdevDrive = () => {
  const maxDrives = config.value.metadataVdevRedundancy === 'mirror3' ? 3 : 2
  if (metadataVdevDrives.value.length < maxDrives) {
    metadataVdevDrives.value.push({ sizeGb: config.value.metadataVdevSizeGb })
  }
}

const removeMetadataVdevDrive = (index) => {
  metadataVdevDrives.value.splice(index, 1)
}

// Watch ZIL config changes
watch(() => config.value.useZIL, (useZIL) => {
  if (useZIL && zilDrives.value.length === 0) {
    addZILDrive()
    if (config.value.zilRedundancy === 'mirror') {
      addZILDrive()
    }
  } else if (!useZIL) {
    zilDrives.value = []
  }
})

watch(() => config.value.zilRedundancy, (redundancy) => {
  if (redundancy === 'mirror' && zilDrives.value.length === 1) {
    addZILDrive()
  } else if (redundancy === 'single' && zilDrives.value.length > 1) {
    zilDrives.value = [zilDrives.value[0]]
  }
})

watch(() => config.value.useL2ARC, (useL2ARC) => {
  if (useL2ARC && l2arcDrives.value.length === 0) {
    addL2ARCDrive()
  } else if (!useL2ARC) {
    l2arcDrives.value = []
  }
})

watch(() => config.value.useMetadataVdev, (useMetadata) => {
  if (useMetadata && metadataVdevDrives.value.length === 0) {
    addMetadataVdevDrive()
    addMetadataVdevDrive() // Always start with a mirror
  } else if (!useMetadata) {
    metadataVdevDrives.value = []
  }
})

watch(() => config.value.metadataVdevRedundancy, (redundancy) => {
  if (redundancy === 'mirror3' && metadataVdevDrives.value.length === 2) {
    addMetadataVdevDrive()
  } else if (redundancy === 'mirror' && metadataVdevDrives.value.length > 2) {
    metadataVdevDrives.value = metadataVdevDrives.value.slice(0, 2)
  }
})

// Calculations
const results = computed(() => {
  return calculatePoolCapacity(vdevs.value)
})

const totalDrives = computed(() => {
  return vdevs.value.reduce((sum, vdev) => sum + vdev.drives.length, 0)
})

const recommendedRAM = computed(() => {
  return calculateRecommendedRAM(
    results.value.totalRawTb,
    config.value.ramScenario === 'dedup'
  )
})

const recommendedZILSize = computed(() => {
  return calculateZILSize(recommendedRAM.value)
})

const recommendedL2ARCSize = computed(() => {
  return calculateL2ARCSize(recommendedRAM.value)
})

// Share functionality
const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// URL Parameter Support
const serializeToURL = () => {
  const data = {
    v: vdevs.value.map(vdev => ({
      r: vdev.raidType,
      d: vdev.drives.map(d => d.capacityTb)
    })),
    c: {
      zil: config.value.useZIL ? {
        s: config.value.zilSizeGb,
        r: config.value.zilRedundancy,
        n: zilDrives.value.length
      } : null,
      l2: config.value.useL2ARC ? {
        s: config.value.l2arcSizeGb,
        n: l2arcDrives.value.length
      } : null,
      meta: config.value.useMetadataVdev ? {
        s: config.value.metadataVdevSizeGb,
        r: config.value.metadataVdevRedundancy,
        n: metadataVdevDrives.value.length
      } : null,
      ram: config.value.ramScenario,
      free: config.value.reserveFreeSpace,
      pct: config.value.freeSpacePercent
    }
  }

  try {
    const encoded = btoa(JSON.stringify(data))
    const url = new URL(window.location.href)
    url.searchParams.set('cfg', encoded)
    window.history.replaceState({}, '', url.toString())
  } catch (e) {
    console.error('Failed to serialize config:', e)
  }
}

const deserializeFromURL = () => {
  try {
    const params = new URLSearchParams(window.location.search)
    const cfg = params.get('cfg')

    if (!cfg) return false

    const data = JSON.parse(atob(cfg))

    // Restore vdevs
    if (data.v && data.v.length > 0) {
      vdevs.value = data.v.map((v, idx) => ({
        id: idx + 1,
        raidType: v.r,
        drives: v.d.map((cap, dIdx) => ({
          id: dIdx + 1,
          capacityTb: cap
        })),
        nextDriveId: v.d.length + 1
      }))
      nextVdevId.value = data.v.length + 1
    }

    // Restore config
    if (data.c) {
      if (data.c.zil) {
        config.value.useZIL = true
        config.value.zilSizeGb = data.c.zil.s
        config.value.zilRedundancy = data.c.zil.r
        zilDrives.value = Array(data.c.zil.n).fill(null).map(() => ({ sizeGb: data.c.zil.s }))
      }

      if (data.c.l2) {
        config.value.useL2ARC = true
        config.value.l2arcSizeGb = data.c.l2.s
        l2arcDrives.value = Array(data.c.l2.n).fill(null).map(() => ({ sizeGb: data.c.l2.s }))
      }

      if (data.c.meta) {
        config.value.useMetadataVdev = true
        config.value.metadataVdevSizeGb = data.c.meta.s
        config.value.metadataVdevRedundancy = data.c.meta.r
        metadataVdevDrives.value = Array(data.c.meta.n).fill(null).map(() => ({ sizeGb: data.c.meta.s }))
      }

      if (data.c.ram) config.value.ramScenario = data.c.ram
      if (data.c.free !== undefined) config.value.reserveFreeSpace = data.c.free
      if (data.c.pct) config.value.freeSpacePercent = data.c.pct
    }

    return true
  } catch (e) {
    console.error('Failed to deserialize config:', e)
    return false
  }
}

// Watch for changes and update URL
watch([vdevs, config, zilDrives, l2arcDrives, metadataVdevDrives], () => {
  serializeToURL()
}, { deep: true })

// Initialize
onMounted(() => {
  initTheme()

  // Try to load from URL
  const loaded = deserializeFromURL()

  // If nothing loaded, add default vdev
  if (!loaded && vdevs.value.length === 0) {
    addVdev()
  }
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: var(--bg-color);
}

.header {
  background-color: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  padding: 1.5rem 0;
  box-shadow: var(--shadow);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.header h1 {
  margin-bottom: 0.25rem;
  font-size: 1.75rem;
}

.theme-toggle {
  background-color: var(--bg-color);
  border: 2px solid var(--border-color);
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  flex-shrink: 0;
  transition: all 0.2s;
}

.theme-toggle:hover {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.calculator-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 1200px) {
  .calculator-layout {
    grid-template-columns: 1fr;
  }
}

.card {
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  margin-bottom: 1.5rem;
}

.card.compact {
  padding: 1rem;
}

.card-header {
  margin-bottom: 1.5rem;
}

.card-header h2, .card-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.vdev-group-container {
  margin-bottom: 1.5rem;
}

.optional-device-section {
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}

.optional-device-section:last-child {
  border-bottom: none;
}

.device-checkbox {
  display: flex;
  align-items: start;
  gap: 0.75rem;
  cursor: pointer;
  margin-bottom: 1rem;
}

.device-checkbox input[type="checkbox"] {
  margin-top: 0.25rem;
  width: auto;
}

.device-config {
  margin-left: 1.75rem;
  padding: 1rem;
  background-color: var(--bg-color);
  border-radius: 4px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 0.75rem;
}

.ram-recommendation {
  padding: 0.75rem;
  background-color: var(--bg-color);
  border-radius: 4px;
  border-left: 3px solid var(--primary-color);
  font-size: 0.95rem;
}

.results-panel {
  position: sticky;
  top: 2rem;
}

.quick-summary {
  margin-bottom: 1.5rem;
}

.summary-card {
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 1rem;
}

.summary-card.primary-summary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
}

.summary-label {
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
  opacity: 0.95;
}

.summary-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.summary-sublabel {
  font-size: 0.9rem;
  opacity: 0.85;
}

.summary-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: var(--bg-color);
  border-radius: 4px;
  font-size: 0.9rem;
}

.stat-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-value {
  font-weight: 700;
  color: var(--text-primary);
}

.detailed-breakdown {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: var(--bg-color);
  border-radius: 4px;
}

.detailed-breakdown summary {
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.breakdown-table {
  margin-top: 0.75rem;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.9rem;
}

.breakdown-row.indent {
  padding-left: 1rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.breakdown-row.highlight {
  background-color: var(--card-bg);
  padding: 0.75rem 0.5rem;
  margin: 0.5rem 0;
  border-radius: 4px;
}

.breakdown-row:last-child {
  border-bottom: none;
}
</style>
