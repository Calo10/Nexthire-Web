# NextHire Web

Public website for the NextHire SaaS product.

## Tech Stack

- **React** 18.2.0
- **TypeScript** 5.2.2
- **Vite** 5.0.8
- **Tailwind CSS** 3.4.0
- **React Router** 6.21.0

## Getting Started

### Prerequisites

- Node.js 18+ (required for Vite)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Logo.tsx
├── layouts/        # Layout components
│   └── MainLayout.tsx
├── pages/          # Page components
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Pricing.tsx
│   ├── Terms.tsx
│   └── Privacy.tsx
├── App.tsx         # Main app component with routing
├── main.tsx        # Entry point
└── index.css       # Global styles with Tailwind
```

## Routes

- `/` - Landing page
- `/login` - Login page (magic link)
- `/pricing` - Pricing page
- `/terms` - Terms of Service
- `/privacy` - Privacy Policy

## Design System

- **Primary Color**: `#8B5CF6` (Purple)
- **Dark Text**: `#0F172A`
- **Light Background**: `#FFFFFF`
- **Neutral Grays**: Standard Tailwind gray scale

## Development Notes

- No backend logic implemented yet (static pages with mock CTAs)
- Authentication logic not implemented
- All forms are placeholder handlers
- Focus on clean structure and visual consistency

