# Changelog

All notable changes to the ZFS Storage Calculator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Dynamic metadata vdev sizing that updates based on pool capacity (15% of pool, minimum 32 GB)
- Responsive layout for Optional ZFS Features section
  - Desktop (≥1200px): 1 row of 4 cards
  - Tablet (768-1199px): 2 rows of 2 cards
  - Mobile (<768px): 4 rows of 1 card

### Changed
- Increased dark mode toggle icon from 32x32 to 40x40 pixels (25% larger)

## [0.3.0] - 2024-11-10

### Added
- Special metadata vdev configuration to Optional Devices
  - Mirrored pair (2-way) or 3-way mirror configurations
  - Size input with dynamic recommendations (10-20% of data pool)
  - Visual drive bays matching ZIL/SLOG and L2ARC style
  - Comprehensive educational content with critical warnings
  - URL serialization/deserialization support

### Changed
- Renamed "Recommended Free Space" to "Free Space Reserved"
- Renamed "Reserved capacity for system" to "System Reserved"
- Enhanced dark mode toggle button
  - Increased icon size from 28x28 to 32x32 pixels
  - Increased stroke width from 2 to 2.5
  - Larger button size (48x48 pixels)
  - Added background color and thicker border (2px)
  - Added blue hover effect with white icon

## [0.2.0] - 2024-11-10

### Added
- Configurable free space reservation
  - Checkbox to enable/disable (defaults to enabled)
  - Percentage slider (5-50%, defaults to 20%)
- Full URL sharing functionality
  - Base64-encoded compact format in 'cfg' query parameter
  - Saves vdevs, drives, RAID types, optional devices, and all settings
  - Auto-updates URL as configuration changes
  - Loads configuration from URL on page load

### Changed
- Renamed "Data Storage Configuration" to "ZFS Pool Configuration"
- Renamed "Unused space" to "Recommended Free Space"
- Increased dark mode toggle icon from 24x24 to 28x28 pixels

### Fixed
- Fixed dark mode text visibility in educational section
  - Changed hardcoded light backgrounds to rgba with transparency
  - Added proper text color variables
- Fixed vdev drive selection bug on newly added vdevs
  - Implemented deep cloning of drives array to prevent shared references
  - Fixed parent-child component synchronization
- Fixed blank screen error on initial load
  - Added missing properties to empty calculation results
  - Added safety check for efficiency calculation division by zero

## [0.1.0] - 2024-11-10

### Added
- Complete redesign with Synology-style interface
- Dark mode support
  - System preference detection
  - Manual theme toggle with sun/moon icons
  - Theme persistence using localStorage
  - CSS variables for both light and dark themes
- Synology-style drive bay visualization with dark backgrounds
- Drive size selector buttons (24TB to 0.5TB)
- Visual capacity bar chart with color-coded segments
- Collapsible detailed breakdown
- Two-column layout with sticky results panel
- Visual drive bays for ZIL/SLOG and L2ARC devices
- Support for mirrored ZIL configuration
- Add/remove drives with visual feedback

### Changed
- Complete UI overhaul for cleaner, more compact layout
- Improved results panel with large primary card
- Quick stats grid (total raw, efficiency, vdevs, drives)
- Enhanced drive management with button grid selection

## [0.0.1] - 2024-11-10

### Added
- Initial Vue 3 + Vite application
- Visual vdev grouping interface
- Support for all ZFS RAID types (Stripe, Mirror, RAIDZ1/2/3)
- Accurate capacity calculations
  - Parity and padding overhead
  - Slop space allocation (1/32 of pool)
  - Metadata overhead (~1.5%)
  - Recommended free space (20%)
- Optional device configuration
  - ZIL/SLOG with mirroring support
  - L2ARC cache configuration
- RAM recommendations
  - Basic mode (1 GB/TB)
  - Deduplication mode (5 GB/TB)
- Comprehensive educational content about ZFS
- Real-time calculation updates
- Accurate TB to TiB conversions
- Per-vdev capacity calculations
- Drive size validation
- Minimum drive requirements per RAID type
- Efficiency and fault tolerance metrics
