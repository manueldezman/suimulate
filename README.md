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

### Styling Approach

- **Inline styles** for dynamic values (template colors, computed dimensions)
- **CSS classes** for structural components and responsive behavior
- **CSS variables** for theming (light/dark mode support)
- **Media queries** for responsive breakpoints (480px, 768px, 1024px)

## Example Usage

### Transfer SUI

```move
module suimulate::transfer {
  use sui::coin::{Self, Coin};
  use sui::sui::SUI;
  use sui::transfer;

  public entry fun transfer_sui(
    mut coin: Coin<SUI>,
    ctx: &mut TxContext
  ) {
    let amount: u64 = 5;
    let payment = coin::split(&mut coin, amount, ctx);
    transfer::public_transfer(payment, @bob);
    transfer::public_transfer(coin, tx_context::sender(ctx));
  }
}
```

Run the simulation to see:
1. Function called by Alice
2. Coin object loaded from object store
3. Coin split creating new payment object
4. Transfer executed (5 SUI moves to Bob)
5. State committed atomically

### Mint NFT

```move
module suimulate::nft {
  use std::string::{Self, String};
  use sui::object::{Self, UID};
  use sui::transfer;
  use sui::tx_context::{Self, TxContext};

  struct ArtNFT has key, store {
    id: UID,
    name: String,
    edition: u64,
    creator: address,
  }

  public entry fun mint_nft(ctx: &mut TxContext) {
    let nft = ArtNFT {
      id: object::new(ctx),
      name: std::string::utf8(b"Genesis #1"),
      edition: 1,
      creator: tx_context::sender(ctx),
    };
    transfer::public_transfer(nft, tx_context::sender(ctx));
  }
}
```

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

## Environment Variables

| Variable | Description | Default | Required |
|-----------|-------------|---------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI simulation | - | No (optional for AI features) |
| `ANTHROPIC_BASE_URL` | Anthropic API base URL | `http://localhost:4000` | No |
| `ANTHROPIC_API_KEY` | Anthropic API key | `DUMMY_KEY` | No |
| `ANTHROPIC_AUTH_TOKEN` | Anthropic auth token | `DUMMY_TOKEN` | No |
| `ANTHROPIC_MODEL` | Anthropic model to use | `claude-3-8-opus-20251001` | No |
| `NVIDIA_NIM_API_KEY` | NVIDIA NIM API key | - | No |
| `ENABLE_THINKING` | Enable provider reasoning requests | `true` | No |

## License

MIT License - feel free to use this project for learning and development.
