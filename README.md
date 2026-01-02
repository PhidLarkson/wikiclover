# WikiCommons Camera App

A PWA for browsing, capturing, and uploading media to Wikimedia Commons — inspired by Zora's social media stacks and Locket's intimate photo sharing.

## Features

- 📸 **Camera Capture** — Take photos directly in the app
- 🎨 **Zora-style Feed** — Swipeable media stacks from Commons
- 👤 **User Profiles** — View your uploads and stats
- 🔐 **Wikimedia OAuth** — Secure login with your Wikimedia account
- 📱 **PWA** — Install on your home screen

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## OAuth Setup (Required for Uploads)

To enable user authentication and uploads, you need to register an OAuth application with Wikimedia:

### 1. Create Wikimedia Account
If you don't have one, create an account at [commons.wikimedia.org](https://commons.wikimedia.org)

### 2. Register OAuth Application
1. Visit: https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose
2. Fill out the form:
   - **Application name**: WikiCommons Camera App
   - **OAuth protocol version**: OAuth 2.0
   - **Callback URL**: `http://localhost:5173/auth/callback` (for development)
   - **Grants needed**:
     - ✅ High-volume editing
     - ✅ Upload new files
     - ✅ Upload, replace, and move files

3. Submit and wait for approval (usually automatic)

### 3. Configure Environment
Create `.env.local` with your credentials:

```env
VITE_WIKIMEDIA_CLIENT_ID=your_client_id_here
VITE_WIKIMEDIA_REDIRECT_URI=http://localhost:5173/auth/callback
```

## Tech Stack

- **React 18** + TypeScript
- **Vite** for fast development
- **React Router** for navigation
- **vite-plugin-pwa** for offline support
- **Wikimedia Commons API** for media

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── context/        # React contexts (Auth)
├── lib/            # API clients and utilities
│   ├── wikimedia-auth.ts  # OAuth 2.0 + PKCE
│   └── wikimedia-api.ts   # Commons API wrapper
├── pages/          # Route pages
└── index.css       # Design system
```

## License

MIT
