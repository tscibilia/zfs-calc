# ZFS Storage Calculator

An interactive web-based calculator for ZFS storage configurations, inspired by the Synology RAID Calculator. Plan your ZFS storage pools with accurate capacity calculations, visual vdev grouping, and comprehensive educational content.

![ZFS Calculator](https://img.shields.io/badge/ZFS-Calculator-blue)
![Vue 3](https://img.shields.io/badge/Vue-3-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Storage Configuration
- **Multiple vdev Groups**: Create and manage multiple vdevs with different RAID types
- **Visual Drive Management**: Add/remove drives with intuitive visual interface
- **All ZFS RAID Types**: Stripe, Mirror, RAIDZ1, RAIDZ2, RAIDZ3
- **Accurate Calculations**: Accounts for parity, slop space, metadata overhead, and padding

### Optional Devices
- **ZIL/SLOG Support**: Configure separate intent log devices with mirroring options
- **L2ARC Cache**: Add read cache devices for improved performance
- **Smart Sizing**: Automatic recommendations based on RAM and use case

### Advanced Features
- **RAM Recommendations**: Basic (1 GB/TB) and Deduplication (5 GB/TB) scenarios
- **URL Sharing**: Share configurations via query parameters
- **Real-time Calculations**: Instant capacity and efficiency updates
- **Educational Content**: Comprehensive information about ZFS types and concepts

### Capacity Calculations
The calculator provides detailed breakdowns including:
- Total raw storage capacity
- Zpool storage capacity (after parity)
- Slop space allocation (ZFS reserved space)
- Metadata overhead
- ZFS usable storage capacity
- Recommended free space (20% for performance)
- Practical usable capacity

## Tech Stack

- **Frontend**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Styling**: Custom CSS with CSS variables
- **Deployment**: Static site (can be hosted anywhere)

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Usage

1. **Add vdev Groups**: Click "Add vdev Group" to create storage groups
2. **Select RAID Type**: Choose from Stripe, Mirror, RAIDZ1, RAIDZ2, or RAIDZ3
3. **Add Drives**: Click the "Add Drive" button and set capacity (all drives in a vdev must be the same size)
4. **Configure Optional Devices**: Enable ZIL/SLOG or L2ARC if needed
5. **Review Results**: See real-time capacity calculations and recommendations
6. **Share Configuration**: Use "Copy Share Link" to share your setup

## ZFS Storage Types

### Stripe
- **No redundancy** - Maximum performance and capacity
- **Fault Tolerance**: None
- **Use Case**: Non-critical data or when backed by other redundancy

### Mirror (RAID1/10)
- **Full copies** across drives - Maximum redundancy
- **Fault Tolerance**: N-1 drives
- **Use Case**: Critical data, high-performance workloads

### RAIDZ1
- **Single parity** - Good balance of capacity and protection
- **Fault Tolerance**: 1 drive
- **Optimal**: 3-9 drives per vdev
- **Use Case**: Home and small business storage

### RAIDZ2
- **Double parity** - Excellent protection with good efficiency
- **Fault Tolerance**: 2 drives
- **Optimal**: 6-10 drives per vdev
- **Use Case**: Recommended for most production environments

### RAIDZ3
- **Triple parity** - Maximum protection
- **Fault Tolerance**: 3 drives
- **Optimal**: 9-15 drives per vdev
- **Use Case**: Large archives, critical data requiring maximum protection

## Understanding vdevs

A **vdev (Virtual Device)** is a group of physical drives forming a single redundant unit:
- All drives in a vdev must be the same size
- Multiple vdevs can be combined into a pool
- Pool performance is limited by the slowest vdev
- Pool capacity is limited by the smallest vdev

## Storage Units

- **TB (Terabyte)**: Decimal units (powers of 10) - 1 TB = 1,000 GB
  - Used by drive manufacturers
- **TiB (Tebibyte)**: Binary units (powers of 2) - 1 TiB = 1,024 GiB
  - Used by operating systems
  - **Conversion**: 1 TB ≈ 0.909 TiB

## Project Structure

```
zfs-calc/
├── src/
│   ├── components/
│   │   ├── VdevGroup.vue          # vdev configuration component
│   │   ├── ResultsPanel.vue        # Results display component
│   │   └── EducationalContent.vue  # Educational information
│   ├── App.vue                     # Main application component
│   ├── main.js                     # Application entry point
│   ├── style.css                   # Global styles
│   └── zfsCalculations.js          # ZFS calculation engine
├── index.html
├── vite.config.js
└── package.json
```

## Contributing

Contributions are welcome! Areas for improvement:
- Additional RAID type visualizations
- Performance comparison tools
- Cost calculation features
- Export configuration to ZFS commands
- Mobile responsiveness improvements

## License

MIT License - feel free to use this calculator for any purpose.

## Acknowledgments

- Inspired by the Synology RAID Calculator
- ZFS calculation methodology from OpenZFS documentation
- Community feedback and contributions
