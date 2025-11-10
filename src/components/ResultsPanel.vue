<template>
  <div class="results-container">
    <div class="card">
      <div class="card-header">
        <h2>Storage Pool Results</h2>
      </div>

      <!-- Quick Summary -->
      <div class="quick-summary">
        <div class="summary-card primary-summary">
          <div class="summary-label">ZFS Usable Storage</div>
          <div class="summary-value">
            {{ results.zfsUsableTb.toFixed(2) }} TB
          </div>
          <div class="summary-sublabel">{{ results.zfsUsableTib.toFixed(2) }} TiB</div>
        </div>

        <div class="summary-card">
          <div class="summary-label">Total Raw Capacity</div>
          <div class="summary-value">{{ results.totalRawTb.toFixed(2) }} TB</div>
          <div class="summary-sublabel">{{ results.totalRawTib.toFixed(2) }} TiB</div>
        </div>

        <div class="summary-card">
          <div class="summary-label">Efficiency</div>
          <div class="summary-value">
            {{ ((results.zfsUsableTb / results.totalRawTb * 100) || 0).toFixed(1) }}%
          </div>
          <div class="summary-sublabel">Usable vs Raw</div>
        </div>
      </div>

      <!-- Detailed Breakdown -->
      <div class="detailed-breakdown">
        <h3>Capacity Breakdown</h3>

        <div class="breakdown-table">
          <div class="breakdown-row header-row">
            <span></span>
            <span class="text-center">TiB</span>
            <span class="text-center">TB</span>
            <span class="text-center">%</span>
          </div>

          <div class="breakdown-row">
            <span class="row-label">Total Raw Storage Capacity</span>
            <span class="text-right">{{ results.totalRawTib.toFixed(2) }}</span>
            <span class="text-right">{{ results.totalRawTb.toFixed(2) }}</span>
            <span class="text-right">100.00</span>
          </div>

          <div class="breakdown-row">
            <span class="row-label">Zpool Storage Capacity</span>
            <span class="text-right">{{ results.zpoolCapacityTib.toFixed(2) }}</span>
            <span class="text-right">{{ results.zpoolCapacityTb.toFixed(2) }}</span>
            <span class="text-right">{{ ((results.zpoolCapacityTb / results.totalRawTb * 100) || 0).toFixed(2) }}</span>
          </div>

          <div class="breakdown-row indent">
            <span class="row-label">Parity & Padding Overhead</span>
            <span class="text-right text-muted">{{ results.parityOverheadTib.toFixed(2) }}</span>
            <span class="text-right text-muted">{{ results.parityOverheadTb.toFixed(2) }}</span>
            <span class="text-right text-muted">{{ ((results.parityOverheadTb / results.totalRawTb * 100) || 0).toFixed(2) }}</span>
          </div>

          <div class="breakdown-row">
            <span class="row-label">Slop Space Allocation</span>
            <span class="text-right text-muted">{{ results.slopSpaceTib.toFixed(2) }}</span>
            <span class="text-right text-muted">{{ results.slopSpaceTb.toFixed(2) }}</span>
            <span class="text-right text-muted">{{ ((results.slopSpaceTb / results.totalRawTb * 100) || 0).toFixed(2) }}</span>
          </div>

          <div class="breakdown-row">
            <span class="row-label">Metadata Overhead</span>
            <span class="text-right text-muted">{{ results.metadataOverheadTib.toFixed(2) }}</span>
            <span class="text-right text-muted">{{ results.metadataOverheadTb.toFixed(2) }}</span>
            <span class="text-right text-muted">{{ ((results.metadataOverheadTb / results.totalRawTb * 100) || 0).toFixed(2) }}</span>
          </div>

          <div class="breakdown-row highlight">
            <span class="row-label"><strong>ZFS Usable Storage Capacity</strong></span>
            <span class="text-right"><strong>{{ results.zfsUsableTib.toFixed(2) }}</strong></span>
            <span class="text-right"><strong>{{ results.zfsUsableTb.toFixed(2) }}</strong></span>
            <span class="text-right"><strong>{{ ((results.zfsUsableTb / results.totalRawTb * 100) || 0).toFixed(2) }}</strong></span>
          </div>

          <div class="breakdown-row">
            <span class="row-label">Recommended Free Space (20%)</span>
            <span class="text-right text-muted">{{ results.recommendedFreeTib.toFixed(2) }}</span>
            <span class="text-right text-muted">{{ results.recommendedFreeTb.toFixed(2) }}</span>
            <span class="text-right text-muted">20.00</span>
          </div>

          <div class="breakdown-row highlight">
            <span class="row-label"><strong>Practical Usable Capacity</strong></span>
            <span class="text-right"><strong>{{ results.practicalUsableTib.toFixed(2) }}</strong></span>
            <span class="text-right"><strong>{{ results.practicalUsableTb.toFixed(2) }}</strong></span>
            <span class="text-right"><strong>{{ ((results.practicalUsableTb / results.totalRawTb * 100) || 0).toFixed(2) }}</strong></span>
          </div>
        </div>
      </div>

      <!-- Pool Configuration Summary -->
      <div class="pool-config-summary" v-if="vdevs.length > 0">
        <h3>Pool Configuration</h3>
        <div class="config-info">
          <div class="info-item">
            <span class="info-label">Number of vdevs:</span>
            <span class="info-value">{{ vdevs.length }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Total Drives:</span>
            <span class="info-value">{{ totalDrives }}</span>
          </div>
          <div v-if="config.useZIL" class="info-item">
            <span class="info-label">ZIL/SLOG:</span>
            <span class="info-value">{{ config.zilSizeGb }} GB ({{ config.zilRedundancy }})</span>
          </div>
          <div v-if="config.useL2ARC" class="info-item">
            <span class="info-label">L2ARC Cache:</span>
            <span class="info-value">{{ config.l2arcSizeGb }} GB × {{ config.l2arcDevices }}</span>
          </div>
        </div>
      </div>

      <!-- Share Configuration -->
      <div class="share-section">
        <button @click="copyShareLink" class="primary">
          {{ copied ? '✓ Copied!' : 'Copy Share Link' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  results: Object,
  vdevs: Array,
  config: Object
})

const copied = ref(false)

const totalDrives = computed(() => {
  return props.vdevs.reduce((sum, vdev) => sum + vdev.drives.length, 0)
})

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
</script>

<style scoped>
.results-container {
  position: sticky;
  top: 2rem;
}

.quick-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--bg-color) 0%, #e8eaf6 100%);
  border-radius: 8px;
  text-align: center;
  border: 1px solid var(--border-color);
}

.summary-card.primary-summary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
}

.summary-label {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.summary-value {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.summary-sublabel {
  font-size: 0.85rem;
  opacity: 0.8;
}

.detailed-breakdown {
  margin-top: 2rem;
}

.breakdown-table {
  margin-top: 1rem;
}

.breakdown-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
}

.breakdown-row.header-row {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--border-color);
}

.breakdown-row.indent {
  padding-left: 1rem;
  font-size: 0.9rem;
}

.breakdown-row.highlight {
  background-color: #f5f5f5;
  padding: 1rem 0.5rem;
  margin: 0.25rem 0;
  border-radius: 4px;
}

.row-label {
  font-size: 0.95rem;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.pool-config-summary {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid var(--border-color);
}

.config-info {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background-color: var(--bg-color);
  border-radius: 4px;
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  font-weight: 600;
}

.share-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.share-section button {
  width: 100%;
}
</style>
