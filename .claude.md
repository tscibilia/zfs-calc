# ZFS Storage Calculator - Technical Documentation

This document contains technical information for developers and AI assistants working on this project.

## Tech Stack

### Frontend Framework
- **Vue 3.4.15** - Composition API with `<script setup>` syntax
- **Vite 5.0.12** - Build tool and dev server
- **@vitejs/plugin-vue 5.0.3** - Vue 3 plugin for Vite

### Core Technologies
- **JavaScript (ES6+)** - Modern JavaScript with modules
- **CSS3** - Custom CSS with CSS variables for theming
- **HTML5** - Semantic markup

### Browser APIs Used
- **localStorage** - Theme persistence
- **Clipboard API** - Copy share link functionality
- **matchMedia** - System dark mode preference detection
- **URL/URLSearchParams** - Configuration sharing via query parameters
- **Base64 encoding** - Compact URL serialization

### No External Dependencies
- Pure Vue 3 with no additional libraries
- No UI frameworks (custom components)
- No state management libraries (Composition API refs/computed)
- No routing (single-page app)

## Project Structure

```
zfs-calc/
├── src/
│   ├── components/
│   │   ├── VdevGroup.vue          # Individual vdev configuration
│   │   │                          # - Drive bay visualization
│   │   │                          # - RAID type selector
│   │   │                          # - Drive management (add/remove)
│   │   │                          # - Deep cloning for reactivity
│   │   │
│   │   ├── DriveSizeSelector.vue  # Synology-style size buttons
│   │   │                          # - 14 common drive sizes
│   │   │                          # - Grid layout (24TB to 0.5TB)
│   │   │
│   │   ├── OptionalDrives.vue     # Visual drive bays for optional devices
│   │   │                          # - ZIL/SLOG, L2ARC, Metadata vdevs
│   │   │                          # - Add/remove drive buttons
│   │   │                          # - Max drives enforcement
│   │   │
│   │   ├── CapacityBar.vue        # Color-coded capacity visualization
│   │   │                          # - Horizontal bar chart
│   │   │                          # - Segments: reserved, available, parity, unused
│   │   │                          # - Responsive labels
│   │   │
│   │   └── EducationalContent.vue # ZFS education section
│   │                              # - RAID types comparison
│   │                              # - vdev concepts
│   │                              # - Storage units (TB vs TiB)
│   │                              # - Optional features (ZIL, L2ARC, metadata)
│   │                              # - Responsive grid layout
│   │
│   ├── App.vue                     # Main application component
│   │                              # - State management
│   │                              # - Theme management
│   │                              # - URL serialization/deserialization
│   │                              # - Results calculations
│   │                              # - Two-column layout
│   │
│   ├── main.js                     # Application entry point
│   │                              # - Vue app creation and mounting
│   │
│   ├── style.css                   # Global styles
│   │                              # - CSS variables for theming
│   │                              # - Light and dark mode definitions
│   │                              # - Responsive breakpoints
│   │                              # - Common component styles
│   │
│   └── zfsCalculations.js          # ZFS calculation engine
│                                   # - TB/TiB conversions
│                                   # - Slop space calculations
│                                   # - Parity overhead calculations
│                                   # - Pool capacity aggregation
│                                   # - RAM/ZIL/L2ARC sizing
│
├── dist/                           # Production build output (gitignored)
├── node_modules/                   # Dependencies (gitignored)
├── imgRefs/                        # Reference images (Synology calculator)
├── index.html                      # HTML entry point
├── vite.config.js                  # Vite configuration
├── package.json                    # Project metadata and dependencies
├── package-lock.json               # Locked dependency versions
├── .gitignore                      # Git ignore patterns
├── README.md                       # User-facing documentation
├── CHANGELOG.md                    # Version history
└── .claude.md                      # This file (technical docs)
```

## Key Technical Concepts

### ZFS Calculations

#### TB to TiB Conversion
```javascript
// 1 TB = 1000 GB (decimal)
// 1 TiB = 1024 GiB (binary)
// 1 TB ≈ 0.909 TiB
function tbToTib(tb) {
  return tb * 1000 / 1024
}
```

#### Slop Space
- **Formula**: 1/32 of total pool capacity
- **Minimum**: 128 MiB (0.000128 TiB)
- **Maximum**: 50% of pool (safety cap)
- **Purpose**: ZFS reserved space for writes when pool is near full

#### Parity Overhead
- **Stripe**: No parity (100% efficient, no redundancy)
- **Mirror**: (N-1)/N drives lost to parity
- **RAIDZ1**: 1 drive + ~3% padding overhead
- **RAIDZ2**: 2 drives + ~3% padding overhead
- **RAIDZ3**: 3 drives + ~3% padding overhead

#### Metadata Overhead
- **Percentage**: ~1.5% of usable capacity
- **Purpose**: Filesystem metadata, checksums, block pointers

### Component Architecture

#### Reactivity Patterns
- **Deep Cloning**: Required for arrays in props to prevent shared references
```javascript
const localVdev = ref({
  ...props.vdev,
  drives: [...(props.vdev.drives || [])]
})
```
- **Computed Properties**: Used for derived state (results, recommendations)
- **Watchers**: Handle side effects (theme changes, URL updates, optional device initialization)

#### State Management
- **No Vuex/Pinia**: Simple enough for Composition API refs
- **Top-level state**: vdevs array, config object, optional drives arrays
- **Event emission**: Child components emit updates to parent (App.vue)

### URL Sharing

#### Serialization Format
```javascript
{
  v: [                              // vdevs array
    {
      r: 'raidz2',                 // RAID type
      d: [18, 18, 18, 18, 18, 18]  // drive capacities in TB
    }
  ],
  c: {                              // config object
    zil: { s: 32, r: 'mirror', n: 2 },     // ZIL/SLOG
    l2: { s: 128, n: 1 },                   // L2ARC
    meta: { s: 512, r: 'mirror', n: 2 },   // Metadata vdev
    ram: 'basic',                           // RAM scenario
    free: true,                             // Reserve free space?
    pct: 20                                 // Free space percentage
  }
}
```
- **Encoding**: JSON.stringify() → btoa() → URL parameter 'cfg'
- **Decoding**: URL parameter 'cfg' → atob() → JSON.parse()
- **Updates**: URL auto-updates on any configuration change

### Theme System

#### CSS Variables
```css
/* Light theme (default) */
--bg-color: #f5f5f5
--card-bg: #ffffff
--text-primary: #333333
--drive-bay-bg: #e0e0e0

/* Dark theme */
--bg-color: #1a1a1a
--card-bg: #2d2d2d
--text-primary: #e0e0e0
--drive-bay-bg: #1a1a1a
```

#### Theme Detection Priority
1. localStorage value (user preference)
2. System preference (`prefers-color-scheme: dark`)
3. Default to light theme

### Optional Devices

#### ZIL/SLOG Sizing
- **Formula**: Match RAM size or minimum 8 GB
- **Redundancy**: Single device or mirrored pair
- **Purpose**: Fast SSD for sync writes

#### L2ARC Sizing
- **Formula**: 5x RAM size
- **Redundancy**: None (cache is disposable)
- **Max Devices**: 4
- **Purpose**: Extended read cache on SSD

#### Metadata vdev Sizing
- **Formula**: 15% of pool capacity (middle of 10-20% range)
- **Minimum**: 32 GB
- **Redundancy**: Mirror (2-way) or 3-way mirror (critical!)
- **Purpose**: Stores filesystem metadata and small blocks
- **Warning**: Loss of metadata vdev = loss of entire pool

## Development Workflow

### Setup
```bash
npm install
npm run dev         # Dev server at http://localhost:5173
```

### Building
```bash
npm run build       # Production build to dist/
npm run preview     # Preview production build
```

### Git Workflow
- Main branch: `main`
- Feature branches: `claude/feature-name-{sessionId}`
- Commit messages: Conventional format with detailed descriptions
- Always test build before committing

## Deployment

### Docker Deployment

#### Local Docker Build and Run
```bash
# Build image
docker build -t zfs-calculator .

# Run container
docker run -d -p 8080:80 --name zfs-calc zfs-calculator

# Access at http://localhost:8080
```

#### Docker Compose
```bash
# Build and run
docker-compose up -d

# Stop
docker-compose down

# Access at http://localhost:8080
```

#### Pull from GitHub Container Registry
```bash
# Pull latest image
docker pull ghcr.io/tscibilia/zfs-calc:latest

# Run from registry
docker run -d -p 8080:80 ghcr.io/tscibilia/zfs-calc:latest
```

### CI/CD Pipeline

#### Automated Release Workflow
The project uses GitHub Actions for automated releases and Docker image publishing.

**Workflow File**: `.github/workflows/release.yml`

**Trigger**: Push to `main` branch

**Version Bumping Rules** (Conventional Commits):
- **Major version bump** (X.0.0):
  - Breaking changes: `feat!:` or `fix!:` or `refactor!:` in commit messages
  - Example: `feat!: redesign API for better performance`

- **Minor version bump** (0.X.0):
  - New features: `feat:` or `feature:` in commit messages
  - Example: `feat: add export to ZFS commands`

- **Patch version bump** (0.0.X):
  - Bug fixes: `fix:` in commit messages
  - Example: `fix: correct slop space calculation`

**Workflow Steps**:
1. **Analyze Commits**: Scans commit messages since last tag
2. **Determine Version**: Calculates next version using semantic versioning
3. **Create Git Tag**: Tags repository with new version (e.g., `v1.2.3`)
4. **Generate Changelog**: Extracts commits for release notes
5. **Create GitHub Release**: Publishes release with changelog
6. **Build Docker Image**: Multi-platform build (amd64, arm64)
7. **Push to GHCR**: Publishes to GitHub Container Registry with tags:
   - `ghcr.io/tscibilia/zfs-calc:1.2.3` (full version)
   - `ghcr.io/tscibilia/zfs-calc:1.2` (major.minor)
   - `ghcr.io/tscibilia/zfs-calc:1` (major only)
   - `ghcr.io/tscibilia/zfs-calc:latest` (always latest)

**Example Commit Messages**:
```bash
# Patch bump (0.3.0 → 0.3.1)
git commit -m "fix: correct metadata vdev size calculation"

# Minor bump (0.3.1 → 0.4.0)
git commit -m "feat: add cost calculator for drive pricing"

# Major bump (0.4.0 → 1.0.0)
git commit -m "feat!: complete UI redesign with breaking changes to URL format"
```

#### Docker Image Details
- **Base Image**: nginx:alpine (lightweight, ~40MB total)
- **Build Process**: Multi-stage build
  - Stage 1: Node.js 18 Alpine for npm build
  - Stage 2: Nginx Alpine for serving static files
- **Platforms**: linux/amd64, linux/arm64
- **Port**: 80 (map to any host port)
- **Health Check**: Configured for container orchestration
- **Compression**: Gzip enabled for static assets

#### Manual Release (if needed)
```bash
# Create tag locally
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Workflow will automatically trigger and create release + Docker image
```

### Static Hosting Deployment

The `dist/` folder can be deployed to any static hosting service:

#### Netlify / Vercel
```bash
# Build
npm run build

# Deploy dist/ folder via CLI or drag-and-drop
```

#### GitHub Pages
```bash
# Add to vite.config.js:
# base: '/zfs-calc/'

npm run build
# Deploy dist/ to gh-pages branch
```

#### Nginx (Manual)
```bash
npm run build
cp -r dist/* /var/www/html/zfs-calc/
```

#### Apache (Manual)
```bash
npm run build
cp -r dist/* /var/www/html/zfs-calc/

# Add .htaccess for SPA routing:
# RewriteEngine On
# RewriteBase /zfs-calc/
# RewriteRule ^index\.html$ - [L]
# RewriteCond %{REQUEST_FILENAME} !-f
# RewriteCond %{REQUEST_FILENAME} !-d
# RewriteRule . /zfs-calc/index.html [L]
```

## Known Issues and Limitations

### Current Limitations
- No export to ZFS command line syntax
- No cost calculations
- No import from existing ZFS pool
- No validation of physically possible configurations (e.g., 100x 24TB drives)
- No performance comparisons between configurations

### Browser Compatibility
- Modern browsers only (ES6+, CSS variables, Composition API)
- No IE11 support
- Requires JavaScript enabled

### Performance Considerations
- Reactivity can lag with 20+ vdevs (rare use case)
- URL length limited by browser (typically 2000-8000 chars)
- No virtualization for very large drive lists

## Future Enhancements

### Potential Features
- Export configuration to ZFS CLI commands
- Import from existing `zpool status` output
- Cost calculator with price per TB
- Performance projections (IOPS, throughput)
- Power consumption estimates
- Visual pool topology diagram
- Comparison mode (multiple configurations side-by-side)
- PDF/PNG export of configuration
- Save/load configurations locally
- Template configurations for common use cases

### Technical Improvements
- TypeScript conversion for type safety
- Component testing (Vitest + Vue Test Utils)
- E2E testing (Playwright)
- Accessibility improvements (ARIA labels, keyboard nav)
- PWA support (offline mode, install prompt)
- i18n support for multiple languages
- Mobile app wrapper (Capacitor/Tauri)

## Resources

### ZFS Documentation
- [OpenZFS Documentation](https://openzfs.github.io/openzfs-docs/)
- [ZFS on Linux](https://zfsonlinux.org/)
- [Oracle ZFS Administration Guide](https://docs.oracle.com/cd/E19253-01/819-5461/)

### Inspiration
- [Synology RAID Calculator](https://www.synology.com/en-us/support/RAID_calculator)
- [45Drives ZFS Calculator](https://zfs-calc.45d.io/)

### Vue 3 Resources
- [Vue 3 Documentation](https://vuejs.org/)
- [Composition API RFC](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0013-composition-api.md)
- [Vite Documentation](https://vitejs.dev/)
