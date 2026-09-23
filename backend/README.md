# DriveOn Backend API

Backend API for DriveOn Car Rental Platform.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (v6+)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB connection string

4. Start development server:
```bash
npm run dev
```

5. Start production server:
```bash
npm start
```

## 📁 Project Structure

```
backend/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── models/         # MongoDB models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
├── validators/     # Input validation
├── server.js       # Server entry point
├── package.json
└── README.md
```
