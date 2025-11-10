# ZFS Storage Calculator

An interactive web-based calculator for planning ZFS storage pools with accurate capacity calculations, visual drive management, and comprehensive educational content. Inspired by the Synology RAID Calculator.

![ZFS Calculator](https://img.shields.io/badge/ZFS-Calculator-blue)
![Vue 3](https://img.shields.io/badge/Vue-3-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Storage Planning
- **Multiple vdev Groups** - Create and configure multiple vdevs with different RAID types
- **Visual Drive Management** - Synology-style drive bays with intuitive add/remove interface
- **All ZFS RAID Types** - Stripe, Mirror, RAIDZ1, RAIDZ2, RAIDZ3 with accurate overhead calculations
- **Real-time Calculations** - Instant capacity updates accounting for:
  - Parity and padding overhead
  - Slop space (ZFS reserved space)
  - Metadata overhead
  - Configurable free space reservation (5-50%, default 20%)

### Optional Devices
- **ZIL/SLOG** - Configure separate intent log SSDs with mirroring for sync write performance
- **L2ARC Cache** - Add read cache devices for improved performance
- **Special Metadata vdev** - Dedicated SSDs for metadata and small blocks (with critical redundancy warnings)
- **Dynamic Sizing Recommendations** - Automatic size suggestions based on pool capacity and RAM

### User Experience
- **Dark Mode** - System preference detection with manual toggle and localStorage persistence
- **Shareable Configurations** - Copy shareable URLs with complete configuration encoded in query parameters
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Educational Content** - Comprehensive information about ZFS concepts, RAID types, and storage units

### Capacity Breakdown
The calculator provides detailed analysis including:
- Total raw storage capacity (TB and TiB)
- Usable capacity after all overhead
- Storage efficiency percentage
- Visual capacity bar with color-coded segments
- Collapsible detailed breakdown table

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/tscibilia/zfs-calc.git
cd zfs-calc

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server will start at `http://localhost:5173`

## Docker Deployment

For production deployment or containerized environments:

```bash
# Option 1: Build locally
docker build -t zfs-calculator .
docker run -d -p 8080:80 zfs-calculator

# Option 2: Use Docker Compose
docker-compose up -d

# Option 3: Pull from GitHub Container Registry
docker pull ghcr.io/tscibilia/zfs-calc:latest
docker run -d -p 8080:80 ghcr.io/tscibilia/zfs-calc:latest
```

Access the application at `http://localhost:8080`

The Docker image is automatically built and published on every release using GitHub Actions. Multi-platform support includes `linux/amd64` and `linux/arm64`.

## Usage Guide

### Basic Configuration

1. **Add vdev Groups**
   - Click "+ Add Another vdev Group" to create storage groups
   - Each vdev group can have a different RAID type

2. **Select RAID Type**
   - Choose from dropdown: Stripe, Mirror, RAIDZ1, RAIDZ2, or RAIDZ3
   - Minimum drives automatically enforced per RAID type

3. **Add Drives**
   - Click a drive size button (24TB to 0.5TB) to add drives
   - All drives in a vdev must be the same size
   - Visual drive bays show occupied and empty slots
   - Remove individual drives with × button or reset all

4. **Configure Optional Devices** (if needed)
   - Enable ZIL/SLOG for improved sync write performance
   - Enable L2ARC for extended read caching
   - Enable Metadata vdev for metadata and small block acceleration
   - Configure redundancy (mirroring recommended for critical devices)

5. **Review Results**
   - Available capacity displayed prominently
   - Quick stats: total raw, efficiency, vdev count, drive count
   - Visual capacity bar shows space allocation
   - Detailed breakdown available in collapsible section

6. **Share Configuration**
   - Click "Copy Share Link" to copy shareable URL
   - URL contains complete configuration in compact Base64 format
   - Anyone with the link can view your exact configuration

### Tips and Best Practices

- **RAIDZ2 Recommended**: Best balance of protection, efficiency, and performance for most use cases
- **Mirror for Speed**: Choose mirror for maximum IOPS and simplest management
- **vdev Sizing**: Keep 3-9 drives for RAIDZ1, 6-10 for RAIDZ2, 9-15 for RAIDZ3
- **Metadata vdev**: Always use mirrored configuration - loss means loss of entire pool!
- **Free Space**: Keep 20% free for optimal performance and COW operations
- **RAM**: Plan for 1 GB per TB (basic) or 5 GB per TB (deduplication)

### Understanding Results

- **Total Raw** - Sum of all drive capacities
- **System Reserved** - Slop space and metadata overhead
- **Parity & Padding** - Space used for redundancy and alignment
- **ZFS Usable** - Actual capacity available for data
- **Free Space Reserved** - Optional buffer for performance (configurable)
- **Practical Usable** - Final capacity after reserved free space
- **Efficiency** - Percentage of raw capacity available for data

## Educational Resources

The calculator includes built-in educational content covering:

- **ZFS RAID Types** - Detailed comparison of Stripe, Mirror, RAIDZ1/2/3
- **vdev Concepts** - How virtual devices work and combine into pools
- **Storage Units** - TB vs TiB conversions and why they differ
- **Optional Features** - When and how to use ZIL/SLOG, L2ARC, and metadata vdevs

Access the "Understanding ZFS Storage" section at the bottom of the calculator for comprehensive explanations.

## Technical Details

For technical documentation including architecture, calculations, and development guidelines, see [.claude.md](.claude.md)

Built with Vue 3, Vite, and modern web technologies. No external dependencies beyond Vue core.

## Contributing

Contributions welcome! Areas for improvement:

- Export configuration to ZFS CLI commands
- Import from existing `zpool status` output
- Cost calculator with price per TB
- Performance projections (IOPS, throughput)
- Multi-language support (i18n)
- Mobile app wrapper

Please open an issue to discuss major changes before submitting a PR.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

## License

MIT License - feel free to use this calculator for any purpose.

## Acknowledgments

- Inspired by the [Synology RAID Calculator](https://www.synology.com/en-us/support/RAID_calculator)
- ZFS calculation methodology from [OpenZFS documentation](https://openzfs.github.io/openzfs-docs/)
- Reference implementation: [45Drives ZFS Calculator](https://zfs-calc.45d.io/)

---

Built with ❤️ for the ZFS community
