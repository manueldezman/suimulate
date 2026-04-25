# Suimulate

An interactive Move language visualizer for the Sui blockchain. Understand how Sui transactions, objects, and smart contracts behave in real-time through step-by-step visualizations.

## Features

- **Interactive Move Code Editor** - Write and edit Move code with syntax highlighting
- **Real-time Visualization** - Watch transactions execute step-by-step with animated visualizations
- **Multiple Templates** - Pre-built examples for common Sui operations:
  - Transfer SUI between wallets
  - Mint NFTs with smart contracts
  - Owned counter with increment operations
  - Marketplace trading with atomic swaps
- **AI-Powered Simulation** - Use Gemini Flash 2.5 to simulate any custom Move function
- **Dual Explanations** - Simple explanations for beginners, technical details for advanced users
- **State Tracking** - See before/after states for wallets and objects
- **Execution Timeline** - Step through transaction execution with detailed breakdowns
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: React 19.2.5 with React DOM
- **Build Tool**: Vite 8.0.9
- **Language**: JavaScript (ES Modules)
- **Styling**: Vanilla CSS with CSS nesting
- **Linting**: ESLint 9.39.4 with React hooks and refresh plugins
- **AI Integration**: Google Gemini Flash 2.5 API

## Prerequisites

- Node.js 18+ and npm
- (Optional) Google Gemini API key for AI-powered simulation

## Installation & Quick Start

```bash
# Clone the repository
git clone https://github.com/manueldezman/suimulate.git
cd suimulate

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

### Using AI Simulation

To enable AI-powered simulation for custom Move functions:

1. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click the "✦ Add Gemini Key" button in the app
3. Enter your API key
4. Write any custom Move function and run the simulation

## Repository Structure

```
suimulate/
├── .env                          # Environment variables (not committed)
├── .gitignore
├── eslint.config.js              # ESLint configuration
├── index.html                    # HTML entry point
├── package.json                  # Dependencies and scripts
├── vite.config.js                # Vite configuration
├── src/
│   ├── App.css                   # Component styles
│   ├── index.css                 # Global styles and CSS variables
│   ├── main.jsx                  # Application entry point
│   └── move-playground.jsx       # Main component with all UI and logic
└── dist/                         # Build output (generated)
```

## Architecture Overview

Suimulate is a single-page React application built around a monolithic component architecture:

### Core Components

- **Suimulate** (main component) - Manages application state, template selection, and simulation orchestration
- **CodeEditor** - Syntax-highlighted code editor with real-time validation
- **VisualizationCanvas** - Renders animated visualizations of transaction execution
- **StatePanel** - Displays before/after states for wallets and objects
- **Timeline** - Step-by-step execution breakdown with navigation
- **ExplanationPanel** - Toggle between simple and technical explanations

### Simulation Flow

1. User selects a template or writes custom Move code
2. Code is parsed for parameters (amount, edition, price, etc.)
3. If custom functions are detected and Gemini key is available, AI generates simulation data
4. Otherwise, built-in simulation logic creates step-by-step execution
5. User runs simulation and watches animated visualization
6. State updates reflect changes to wallets and objects

## Testing Instructions

```bash
# Run linter
npm run lint

# Start development server
npm run dev

# Test AI simulation:
# - Click "✦ Add Gemini Key"
# - Enter valid Gemini API key
# - Write custom Move function
# - Run simulation and verify AI-generated steps
```

## License

MIT License - feel free to use this project for learning and development.
