# 🚛 Transport Invoice System

A modern PWA for managing transport vehicle entries and generating GST invoices.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express + MongoDB
- **PWA**: Vite PWA Plugin (Workbox)

## Project Structure

```
transport-invoice-app/
├── client/          # React Frontend (PWA)
└── server/          # Node.js Backend
```

## 🚀 Quick Start

### Frontend (Client)

```bash
cd client
npm install
npm run dev
```

Opens at http://localhost:5173

### Build for Production

```bash
npm run build
npm run preview
```

### Backend (Server)

```bash
cd server
npm install
# Create .env file with MONGO_URI and PORT
npm run dev
```

## 📱 PWA Features

- **Install Button**: Shown only on web browser, hidden when running as installed app
- **Bottom Navigation**: Visible only on mobile (< lg breakpoint)
- **Desktop Sidebar**: Visible only on lg+ screens
- **Offline Support**: Workbox service worker caches assets
- **Dark Mode**: System preference + manual toggle

## 🎨 Design Highlights

- Gradient stats cards with hover animations
- Area/Bar chart toggle for revenue vs vehicles
- Glassmorphism sidebar and navbar
- Skeleton loading states
- Empty state UI
- GST-ready invoice system (18% IGST)

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| react-router-dom | Client-side routing |
| lucide-react | Icons |
| recharts | Charts |
| vite-plugin-pwa | PWA + service worker |
| date-fns | Date formatting |
| clsx | Conditional classes |

## 🔧 Environment Variables (Server)

Create `server/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/transport-invoice
NODE_ENV=development
```

## 📄 Invoice Features

- Auto GST calculation (IGST 18%)
- Amount to words (Indian format)
- PDF export via Puppeteer
- Auto invoice numbering
- Save to MongoDB

## 🎯 Upcoming Pages

- `AddEntry.jsx` — Vehicle entry form
- `InvoicePage.jsx` — Invoice list + generator
- `InvoicePreview.jsx` — PDF preview
- `HistoryPage.jsx` — Full entry history
- `SettingsPage.jsx` — Company details, GST config
