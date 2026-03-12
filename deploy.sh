#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# ArkazGPT — VPS Deployment Helper
# Usage:
#   ./deploy.sh          — Full first-time setup
#   ./deploy.sh update   — Pull latest code and redeploy
#   ./deploy.sh seed     — Seed the database with initial data
#   ./deploy.sh logs     — Tail application logs
# ─────────────────────────────────────────────────────────────────────────────
set -e

COMPOSE="docker compose"

case "${1:-}" in

  # ── update: pull + rebuild + restart ────────────────────────────────────────
  update)
    echo "▶ Pulling latest code..."
    git pull origin main

    echo "▶ Rebuilding and restarting app..."
    $COMPOSE build app
    $COMPOSE up -d --no-deps app

    echo "✅ Update complete."
    ;;

  # ── seed: run prisma seed inside running container ───────────────────────────
  seed)
    echo "▶ Running database seed..."
    $COMPOSE exec app npx prisma db seed
    echo "✅ Seed complete."
    echo "   Default login: admin@arkazsaudi.com / admin123"
    echo "   ⚠  Change the admin password after first login!"
    ;;

  # ── logs: tail app logs ──────────────────────────────────────────────────────
  logs)
    $COMPOSE logs -f app
    ;;

  # ── default: first-time full setup ──────────────────────────────────────────
  *)
    if [ ! -f .env ]; then
      echo "❌ No .env file found."
      echo "   Copy .env.production to .env and fill in your values:"
      echo "   cp .env.production .env && nano .env"
      exit 1
    fi

    echo "▶ Building images..."
    $COMPOSE build

    echo "▶ Starting all services..."
    $COMPOSE up -d

    echo "▶ Waiting for the app to be ready..."
    sleep 8

    echo "▶ Running initial database seed..."
    $COMPOSE exec app npx prisma db seed || echo "  (seed skipped — may already be seeded)"

    echo ""
    echo "✅ ArkazGPT is live!"
    echo "   Open: \$(grep NEXTAUTH_URL .env | cut -d= -f2)"
    echo "   Default login: admin@arkazsaudi.com / admin123"
    echo "   ⚠  Change the admin password after first login!"
    ;;
esac
