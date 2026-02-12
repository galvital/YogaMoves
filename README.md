# 🧘‍♀️ YogaMoves

Yoga session attendance tracker — manage sessions, track participation, generate monthly reports.

## Features

- **Admin Dashboard** — Create yoga sessions, manage participants, view reports
- **Session RSVP** — Shareable links for participants to mark Joining / Not Joining / Maybe
- **Attendance Reports** — Monthly breakdown per participant with insights
- **Bilingual** — Hebrew (default) + English, with RTL support
- **PWA** — Mobile-first, works great on desktop too

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + TailwindCSS + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite via Drizzle ORM + Better-SQLite3 |
| Auth | Google OAuth (admin) + Phone OTP (participants) |

## Prerequisites

- **Node.js** 18+ 
- **npm** 9+
- A **Google OAuth** client ID/secret ([create one here](https://console.cloud.google.com/apis/credentials))

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/galvital/YogaMoves.git
cd YogaMoves
```

### 2. Install dependencies

```bash
# Install all dependencies (root + backend + frontend)
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in:

```env
# Required
JWT_SECRET=pick-a-random-secret-string
JWT_REFRESH_SECRET=pick-another-random-secret-string

# Google OAuth (for admin login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

> **Google OAuth Setup:**
> 1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
> 2. Create a new OAuth 2.0 Client ID (Web application)
> 3. Add `http://localhost:5000/api/auth/google/callback` as an authorized redirect URI
> 4. Copy the Client ID and Client Secret into your `.env`

### 4. Initialize the database

```bash
cd backend
npm run db:migrate
```

### 5. Run the app

From the **root** directory:

```bash
npm run dev
```

This starts both:
- **Backend** → http://localhost:5000
- **Frontend** → http://localhost:3000

### Or run them separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 📱 SMS OTP (Participants)

SMS is **mocked** in development — OTP codes are logged to the backend console. No SMS provider needed for local development.

To enable real SMS in production, configure Twilio in `backend/.env`:

```env
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

## 📁 Project Structure

```
YogaMoves/
├── backend/
│   ├── src/
│   │   ├── db/           # Database schema & migrations
│   │   ├── middleware/    # Auth & validation middleware
│   │   ├── routes/        # API routes
│   │   └── utils/         # Helpers
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts (Auth, Language)
│   │   ├── hooks/        # Custom hooks
│   │   ├── i18n/         # Translations (he/en)
│   │   ├── pages/        # Route pages
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # API client, formatting
│   └── index.html
└── package.json          # Workspace root
```

## License

MIT
