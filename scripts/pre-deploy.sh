#!/bin/bash
set -e

echo "🚀 Pre-Deployment Checks"
echo ""

echo "1️⃣  Running tests..."
npm test || { echo "❌ Tests failed"; exit 1; }

echo ""
echo "2️⃣  Running linter..."
npm run lint || { echo "❌ Linting failed"; exit 1; }

echo ""
echo "3️⃣  Running type check..."
npx tsc --noEmit || { echo "❌ Type check failed"; exit 1; }

echo ""
echo "4️⃣  Building..."
npm run build || { echo "❌ Build failed"; exit 1; }

echo ""
echo "5️⃣  Checking environment variables..."
required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing: $var"
    exit 1
  fi
done

echo ""
echo "✅ All pre-deployment checks passed!"
echo ""
echo "Next steps:"
echo "1. Push changes: git push origin main"
echo "2. Wait for CI/CD tests to pass"
echo "3. Manually deploy: GitHub Actions deploy workflow"
echo "4. Check health: curl https://app.credicontrol.com/api/health"
