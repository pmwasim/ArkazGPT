# ArkazGPT — Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 14+

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy and edit the environment file:
```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/arkaz_gpt"
NEXTAUTH_URL="https://your-domain.com"   # or http://localhost:3000 for dev
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
```

### 3. Database Setup
```bash
# Run migrations
npm run db:migrate

# Seed with initial data
npm run db:seed
```

Default login after seed:
- **Admin**: admin@arkazsaudi.com / admin123
- **Technician**: tech@arkazsaudi.com / tech123

> ⚠️ Change passwords immediately after first login!

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Modules

| Module | Path | Description |
|--------|------|-------------|
| Dashboard | `/dashboard` | Overview & stats |
| Service Receipts | `/service-receipts` | Issue receipts, collect signatures |
| Delivery Notes | `/delivery-notes` | Delivery notes with mobile signatures |
| Tasks | `/tasks` | Task assignment & tracking |
| Field Service | `/field-service` | Schedule & track field visits |
| Customers | `/customers` | Customer management |
| Projects | `/projects` | Project/site management |
| Stock | `/stock` | Inventory management |
| Tools | `/tools` | Tool tracking & assignment |
| Expenses | `/expenses` | Expense submission & approval |
| Accounts | `/accounts` | Chart of accounts |
| Invoices | `/invoices` | Reference tax invoices with ZATCA QR |
| Settings | `/settings` | Company info & configuration |

## ZATCA QR Code

Two modes supported:
1. **Embed external QR**: Paste the base64 QR data from your accounting software
2. **Generate directly**: Set company name + VAT number in Settings → system generates TLV-encoded QR

> This is a **reference invoice only**, not a legal ZATCA e-invoice. Always reference the actual invoice from your compliant accounting system.

## PWA (Mobile App)

The platform is a Progressive Web App:
- Open on mobile → "Add to Home Screen"
- Works offline for viewing cached data
- Touch-friendly signature pad for field use

## Production Deployment

```bash
npm run build
npm run start
```

Or deploy to Vercel/Railway/any Node.js host.
