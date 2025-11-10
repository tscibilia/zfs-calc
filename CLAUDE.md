# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZFS Storage Calculator is an interactive web-based calculator for planning ZFS storage configurations. It provides accurate capacity calculations accounting for parity, slop space, metadata overhead, and padding. Inspired by the Synology RAID Calculator.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (port 5173 by default)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **Vue 3** with Composition API (`<script setup>`)
- **Vite** as build tool (v5.0.12)
- **No state management library** - uses Vue's reactive refs
- **No testing framework** - currently no test suite
- **No linting/formatting tools** configured

## Architecture

### Core Calculation Engine (`src/zfsCalculations.js`)

The heart of the application - a pure JavaScript module with no dependencies. Contains all ZFS-specific calculation logic:

- **Unit conversions**: TB ↔ TiB conversions accounting for decimal (1000) vs binary (1024) units
- **Capacity calculations**: Per-vdev and pool-wide calculations with overhead
- **RAID type metadata**: Configuration requirements, fault tolerance, performance characteristics
- **Validation**: Ensures vdev configurations meet minimum requirements
- **Overhead calculations**:
  - Parity overhead (varies by RAID type)
  - Slop space (1/32 of pool, min 128 MiB, max half the pool)
  - Metadata overhead (~1.5%)
  - Stripe padding (~3% for RAIDZ types)

All functions are pure and can be tested/used independently.

### Component Structure

**`App.vue`** - Main application component
- Manages all vdevs (virtual device groups) in reactive array
- Handles optional device configuration (ZIL/SLOG, L2ARC)
- Implements URL-based configuration sharing via serialization
- Coordinates calculations via computed properties
- Uses 2-column grid layout (config panel + results panel)

**`VdevGroup.vue`** - Individual vdev configuration
- Manages drives within a single vdev (all must be same size)
- Validates RAID type requirements
- Visual drive grid with add/remove functionality
- Real-time capacity and efficiency display
- Automatically enforces minimum drive counts when RAID type changes

**`ResultsPanel.vue`** - Displays calculation results
- Shows capacity breakdown (raw → zpool → usable)
- Visualizes efficiency and overhead
- Provides sharing functionality

**`EducationalContent.vue`** - Reference information
- RAID type explanations and recommendations
- ZFS concepts and best practices

### State Management Pattern

- **No Vuex/Pinia** - state lives in `App.vue`
- Vdevs array managed with `ref()` and reactive updates
- Parent-child communication via props (down) and emits (up)
- `VdevGroup` maintains local copy of vdev and syncs via watchers
- URL params sync via `watch()` on state changes

### URL Configuration Sharing

Configurations are serialized to URL query params:
- Compact JSON format (shortened keys: `r` for raidType, `d` for drives)
- Survives page refresh
- Enables sharing configurations
- Deserialized on mount to restore state

## Key Implementation Details

### Drive Size Enforcement
When user changes any drive size in a vdev, ALL drives in that vdev update to match (ZFS requirement). See `VdevGroup.vue:updateDriveSize()`.

### RAID Type Validation
When RAID type changes, component automatically adds drives to meet minimum requirements (e.g., RAIDZ2 needs ≥4 drives). See `VdevGroup.vue:onRaidTypeChange()`.

### Calculation Flow
1. User modifies vdevs → local state updates
2. Watcher emits update to parent (`App.vue`)
3. Computed property `calculationResults` recalculates via `calculatePoolCapacity()`
4. Results flow down to `ResultsPanel` via props
5. URL updates via separate watcher

### CSS Architecture
- CSS variables for theming (defined in `src/style.css`)
- Scoped component styles
- Grid-based layouts (vdevs, drives, main layout)
- Responsive breakpoints at 1024px

## File Organization

```
src/
├── App.vue                      # Root component & state management
├── main.js                      # Vue app initialization
├── style.css                    # Global styles & CSS variables
├── zfsCalculations.js           # Pure calculation functions
└── components/
    ├── VdevGroup.vue            # Per-vdev configuration UI
    ├── ResultsPanel.vue         # Calculation results display
    └── EducationalContent.vue   # Static educational content
```

## Development Notes

- **No TypeScript** - using plain JavaScript
- **No prop validation** - Vue components use Object/Number without detailed PropTypes
- **Vite base path** set to `./` for flexible deployment (can be served from subdirectory)
- **Drive IDs** are component-local and not globally unique (safe because scoped to vdev)
- **Next ID counters** track via `nextVdevId` and per-vdev `nextDriveId`

## ZFS-Specific Knowledge

Understanding these concepts is critical when modifying calculations:

- **vdev**: A group of drives forming one redundant unit. Pool capacity is sum of all vdevs.
- **Slop space**: Reserved space ZFS keeps for metadata and emergency allocations (1/32 of pool)
- **Stripe padding**: RAIDZ overhead for aligning data across variable-width stripes (~3%)
- **Metadata**: Internal ZFS structures for tracking blocks, checksums, snapshots (~1.5%)
- **TB vs TiB**: Marketing uses TB (decimal), systems use TiB (binary). Calculator shows both.
- **Pool vs Usable**: "Zpool capacity" is after parity, "ZFS usable" is after all overhead

Calculation order: Raw → After Parity → After Padding → Zpool Capacity → (minus slop & metadata) → ZFS Usable → (minus 20% recommended free space) → Practical Usable

## Common Development Patterns

### Adding a New RAID Type
1. Update `getRaidTypeInfo()` in `zfsCalculations.js` with type metadata
2. Add parity calculation in `calculateParityOverhead()`
3. Add option to `<select>` in `VdevGroup.vue`
4. Update validation in `validateVdev()`

### Adding a New Overhead Factor
1. Create calculation function in `zfsCalculations.js`
2. Integrate into `calculatePoolCapacity()` or `calculateVdevCapacity()`
3. Display in `ResultsPanel.vue` breakdown

### Adding New Optional Device Type
1. Add state to `config` ref in `App.vue`
2. Add UI controls in optional devices card
3. Create recommendation calculation function
4. Update URL serialization/deserialization

## Browser Compatibility

Standard modern browser features used:
- ES6+ (destructuring, arrow functions, computed properties)
- URL API for query param management
- Vue 3 Composition API
