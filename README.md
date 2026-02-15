# CNC Web Simulator v1.0

A high-performance, web-based CNC simulator for lathe and milling operations. Built with modern web technologies, it allows for real-time G-code interpretation, material removal visualization, and precision execution tracking.

## 🚀 Key Features

- **Multi-Machine Simulation**: Switch between **Mill** and **Lathe** environments with machine-specific physics and visualization.
- **Advanced Simulation Controls**:
  - **Simulate/Stop Toggle**: Robust session management with auto-reset functionality.
  - **Variable Speed**: Control simulation speed from **0.25x up to 2.0x**.
  - **Execution Modes**: Toggle between **Continuous** execution and **Single-Line (Step)** mode for meticulous debugging.
- **Intelligent G-Code Editor**:
  - Based on **Ace Editor** with custom CNC syntax highlighting.
  - **Real-Time Highlighting**: The editor automatically scrolls to and highlights the line currently being executed.
- **Integrated G-Code Guide**: Built-in reference manual for standard G and M codes.
- **Workpiece & Material Management**:
  - Configurable stock dimensions and tool parameters.
  - Premium material aesthetics (Metal, Wood, Plastic, etc.) with realistic lighting.
- **Persistence**: Automatically saves your project state, machine settings, and G-code locally.

## 🛠️ Technology Stack

- **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Graphics**: [Three.js](https://threejs.org/) (r74 optimized for simulation performance)
- **Editor**: [Ace Editor](https://ace.c9.io/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Deployment**: [GitHub Actions](https://github.com/features/actions) for automated [GitHub Pages](https://pages.github.com/) hosting.

## 💻 Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/aakashvirdhe/cnc-sim.git
   cd cnc-sim
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🌐 Deployment

This project is configured for automated deployment to GitHub Pages.

1. Go to your repository **Settings > Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Every push to the `main` branch will automatically build and publish the site.

The site will be live at: `https://[your-username].github.io/cnc-sim/`

## 🗺️ Roadmap

- **v1.0 (Current)**: Stable release with core simulation, speed controls, and step mode.
- **v2.0 (Planned)**:
  - real time material removal
  - tool visibility
  - spindle visibility
  - Enhanced DX (Developer Experience) with more granular diagnostics.

---
*Created and maintained by Aakash Virdhe*
