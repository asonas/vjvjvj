# VJ Application

An audio-reactive visual effects application built with [vedajs](https://veda.gl/vedajs) and [three.js](https://threejs.org/).

## Features

- Real-time audio visualization
- Multiple animation patterns (kaleidoscope, tunnel zoom, particle field, etc.)
- BPM synchronization
- Microphone input support
- WebGL-based shader effects

## Setup

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vjvjvj
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Development

Start the development server:
```bash
npm run dev
```

Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`).

### Production Build

Build the application for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Controls

1. Click the "オーディオ開始" (Start Audio) button to begin
2. Allow microphone access when prompted
3. The application will automatically switch between different visual patterns
4. Audio volume and BPM information are displayed in the debug panel

## Browser Requirements

- Modern browser with WebGL support
- Microphone access permission

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Third-Party Libraries

This project uses the following open-source libraries:
- [vedajs](https://github.com/fand/vedajs) - Shader Art Framework
- [three.js](https://threejs.org/) - 3D JavaScript library

For complete attribution, see [NOTICES](NOTICES) file.
