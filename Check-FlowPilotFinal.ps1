# FlowPilot-Final-Merged Structure Validation Script
# Run from: C:\Users\HP\Desktop\FlowPilot-Final-Merged

$basePath = "C:\Users\HP\Desktop\FlowPilot-Final-Merged"

# Arrays to track results
$success = @()
$warnings = @()
$errors = @()

function CheckFile {
    param(
        [string]$Description,
        [string]$Path,
        [switch]$Required = $true
    )

    if (Test-Path $Path) {
        $success += "${Description}: OK - ${Path}"
    } elseif ($Required) {
        $errors += "${Description}: MISSING - ${Path}"
    } else {
        $warnings += "${Description}: Optional missing - ${Path}"
    }
}

function CheckDir {
    param(
        [string]$Description,
        [string]$Path,
        [switch]$Required = $true
    )

    if (Test-Path $Path -PathType Container) {
        $success += "${Description}: OK - ${Path}/"
    } elseif ($Required) {
        $errors += "${Description}: MISSING - ${Path}/"
    } else {
        $warnings += "${Description}: Optional missing - ${Path}/"
    }
}

Write-Host "=== FlowPilot-Final-Merged Structure Check ===" -ForegroundColor Cyan
Write-Host "Base: $basePath" -ForegroundColor Gray
Write-Host ""

# --- ROOT REQUIRED FILES ---
CheckFile "docker-compose.yml" "$basePath\docker-compose.yml"
CheckFile ".env.example" "$basePath\.env.example"
CheckFile "README.md" "$basePath\README.md"
CheckFile "README-PRODUCTION.md" "$basePath\README-PRODUCTION.md"
CheckFile ".gitignore" "$basePath\.gitignore"
CheckFile "ASSEMBLY-REPORT.md" "$basePath\ASSEMBLY-REPORT.md"

# --- ROOT REQUIRED DIRECTORIES ---
CheckDir "web (app source)" "$basePath\web"
CheckDir "scripts (ops scripts)" "$basePath\scripts"
CheckDir "docs (documentation)" "$basePath\docs"
CheckDir "coolify (deployment config)" "$basePath\coolify"
CheckDir "env (env templates)" "$basePath\env"
CheckDir "backups (backup dir)" "$basePath\backups"

# --- WEB APP STRUCTURE ---
CheckFile "web/package.json" "$basePath\web\package.json"
CheckFile "web/tsconfig.json" "$basePath\web\tsconfig.json"
CheckFile "web/next.config.js" "$basePath\web\next.config.js"
CheckFile "web/Dockerfile" "$basePath\web\Dockerfile"
CheckFile "web/index.html" "$basePath\web\index.html"
CheckFile "web/middleware.ts" "$basePath\web\middleware.ts"

CheckDir "web/app (Next.js App Router)" "$basePath\web\app"
CheckDir "web/app/api (API routes)" "$basePath\web\app\api"
CheckDir "web/app/(dashboard) (Dashboard layout)" "$basePath\web\app\(dashboard\)"
CheckDir "web/components (React components)" "$basePath\web\components"
CheckDir "web/lib (Shared utilities)" "$basePath\web\lib"
CheckDir "web/prisma (Database schema)" "$basePath\web\prisma"
CheckDir "web/public (Static assets)" "$basePath\web\public"
CheckDir "web/scripts (Build/seed scripts)" "$basePath\web\scripts"
CheckDir "web/workers (Background workers)" "$basePath\web\workers"
CheckDir "web/types (TypeScript types)" "$basePath\web\types"

# --- KEY WEB FILES ---
CheckFile "web/prisma/schema.prisma" "$basePath\web\prisma\schema.prisma"
CheckFile "web/scripts/docker-entrypoint.sh" "$basePath\web\scripts\docker-entrypoint.sh"
CheckFile "web/scripts/seed.ts" "$basePath\web\scripts\seed.ts"
CheckFile "web/scripts/create-api-key.ts" "$basePath\web\scripts\create-api-key.ts"
CheckFile "web/public/sw.js" "$basePath\web\public\sw.js"

# --- KEY COMPONENTS ---
CheckFile "web/components/Sidebar.tsx" "$basePath\web\components\Sidebar.tsx"
CheckFile "web/components/Topbar.tsx" "$basePath\web\components\Topbar.tsx"
CheckFile "web/components/MobileNav.tsx" "$basePath\web\components\MobileNav.tsx"
CheckFile "web/components/OrgSwitcher.tsx" "$basePath\web\components\OrgSwitcher.tsx"
CheckFile "web/components/StatCard.tsx" "$basePath\web\components\StatCard.tsx"
CheckFile "web/components/EmptyState.tsx" "$basePath\web\components\EmptyState.tsx"
CheckFile "web/components/PWARegister.tsx" "$basePath\web\components\PWARegister.tsx"

# --- KEY LIB FILES ---
CheckFile "web/lib/auth.ts" "$basePath\web\lib\auth.ts"
CheckFile "web/lib/auth-options.ts" "$basePath\web\lib\auth-options.ts"
CheckFile "web/lib/prisma.ts" "$basePath\web\lib\prisma.ts"
CheckFile "web/lib/redis.ts" "$basePath\web\lib\redis.ts"
CheckFile "web/lib/queue.ts" "$basePath\web\lib\queue.ts"
CheckFile "web/lib/rbac.ts" "$basePath\web\lib\rbac.ts"
CheckFile "web/lib/rate-limit.ts" "$basePath\web\lib\rate-limit.ts"
CheckFile "web/lib/tenant.ts" "$basePath\web\lib\tenant.ts"
CheckFile "web/lib/org.ts" "$basePath\web\lib\org.ts"
CheckFile "web/lib/data.ts" "$basePath\web\lib\data.ts"
CheckFile "web/lib/n8n.ts" "$basePath\web\lib\n8n.ts"
CheckFile "web/lib/api-error.ts" "$basePath\web\lib\api-error.ts"
CheckFile "web/lib/secure-api.ts" "$basePath\web\lib\secure-api.ts"
CheckFile "web/lib/logger.ts" "$basePath\web\lib\logger.ts"
CheckFile "web/lib/api-key-auth.ts" "$basePath\web\lib\api-key-auth.ts"

# --- KEY WORKERS ---
CheckFile "web/workers/message-worker.ts" "$basePath\web\workers\message-worker.ts"
CheckFile "web/workers/campaign-worker.ts" "$basePath\web\workers\campaign-worker.ts"
CheckFile "web/workers/automation-worker.ts" "$basePath\web\workers\automation-worker.ts"
CheckFile "web/workers/email-worker.ts" "$basePath\web\workers\email-worker.ts"

# --- API ROUTE GROUPS ---
CheckDir "web/app/api/auth" "$basePath\web\app\api\auth"
CheckDir "web/app/api/billing" "$basePath\web\app\api\billing"
CheckDir "web/app/api/contacts" "$basePath\web\app\api\contacts"
CheckDir "web/app/api/health" "$basePath\web\app\api\health"
CheckDir "web/app/api/public" "$basePath\web\app\api\public"
CheckDir "web/app/api/v1" "$basePath\web\app\api\v1"
CheckDir "web/app/api/whatsapp" "$basePath\web\app\api\whatsapp"

# --- DASHBOARD ROUTE GROUPS ---
CheckDir "web/app/(dashboard)/dashboard" "$basePath\web\app\(dashboard\)\dashboard"
CheckDir "web/app/(dashboard)/analytics" "$basePath\web\app\(dashboard\)\analytics"
CheckDir "web/app/(dashboard)/contacts" "$basePath\web\app\(dashboard\)\contacts"
CheckDir "web/app/(dashboard)/campaigns" "$basePath\web\app\(dashboard\)\campaigns"
CheckDir "web/app/(dashboard)/automations" "$basePath\web\app\(dashboard\)\automations"
CheckDir "web/app/(dashboard)/pipeline" "$basePath\web\app\(dashboard\)\pipeline"
CheckDir "web/app/(dashboard)/inbox" "$basePath\web\app\(dashboard\)\inbox"
CheckDir "web/app/(dashboard)/broadcast" "$basePath\web\app\(dashboard\)\broadcast"
CheckDir "web/app/(dashboard)/automation-builder" "$basePath\web\app\(dashboard\)\automation-builder"
CheckDir "web/app/(dashboard)/settings" "$basePath\web\app\(dashboard\)\settings"
CheckDir "web/app/(dashboard)/billing-portal" "$basePath\web\app\(dashboard\)\billing-portal"
CheckDir "web/app/(dashboard)/reports" "$basePath\web\app\(dashboard\)\reports"
CheckDir "web/app/(dashboard)/support" "$basePath\web\app\(dashboard\)\support"
CheckDir "web/app/(dashboard)/design" "$basePath\web\app\(dashboard\)\design"
CheckDir "web/app/(dashboard)/agency-wizard" "$basePath\web\app\(dashboard\)\agency-wizard"
CheckDir "web/app/(dashboard)/welcome" "$basePath\web\app\(dashboard\)\welcome"

# --- V1 API SUB-ROUTES ---
CheckDir "web/app/api/v1/agency" "$basePath\web\app\api\v1\agency"
CheckDir "web/app/api/v1/analytics" "$basePath\web\app\api\v1\analytics"
CheckDir "web/app/api/v1/api-keys" "$basePath\web\app\api\v1\api-keys"
CheckDir "web/app/api/v1/billing" "$basePath\web\app\api\v1\billing"
CheckDir "web/app/api/v1/campaigns" "$basePath\web\app\api\v1\campaigns"
CheckDir "web/app/api/v1/contacts" "$basePath\web\app\api\v1\contacts"
CheckDir "web/app/api/v1/conversations" "$basePath\web\app\api\v1\conversations"
CheckDir "web/app/api/v1/me" "$basePath\web\app\api\v1\me"
CheckDir "web/app/api/v1/members" "$basePath\web\app\api\v1\members"
CheckDir "web/app/api/v1/onboarding" "$basePath\web\app\api\v1\onboarding"
CheckDir "web/app/api/v1/organizations" "$basePath\web\app\api\v1\organizations"
CheckDir "web/app/api/v1/tickets" "$basePath\web\app\api\v1\tickets"
CheckDir "web/app/api/v1/whatsapp" "$basePath\web\app\api\v1\whatsapp"
CheckDir "web/app/api/v1/whatsapp-templates" "$basePath\web\app\api\v1\whatsapp-templates"
CheckDir "web/app/api/v1/whitelabel" "$basePath\web\app\api\v1\whitelabel"
CheckDir "web/app/api/v1/workflows" "$basePath\web\app\api\v1\workflows"
CheckDir "web/app/api/v1/demo" "$basePath\web\app\api\v1\demo"

# --- DOCS ---
CheckFile "docs/CLIENT-DEMO-SCRIPT.md" "$basePath\docs\CLIENT-DEMO-SCRIPT.md"
CheckFile "docs/COOLIFY.md" "$basePath\docs\COOLIFY.md"
CheckFile "docs/COOLIFY-ENV-TEMPLATE.md" "$basePath\docs\COOLIFY-ENV-TEMPLATE.md"
CheckFile "docs/FINAL-BUGFIX-AUDIT.md" "$basePath\docs\FINAL-BUGFIX-AUDIT.md"
CheckFile "docs/FOLDER-STRUCTURE.md" "$basePath\docs\FOLDER-STRUCTURE.md"
CheckFile "docs/GITHUB-GUIDE.md" "$basePath\docs\GITHUB-GUIDE.md"
CheckFile "docs/ONBOARDING.md" "$basePath\docs\ONBOARDING.md"
CheckFile "docs/PRODUCTION-LAUNCH-COMMANDS.md" "$basePath\docs\PRODUCTION-LAUNCH-COMMANDS.md"
CheckFile "docs/QA-TEST-SCRIPTS.md" "$basePath\docs\QA-TEST-SCRIPTS.md"
CheckFile "docs/SALES-PAGE-COPY.md" "$basePath\docs\SALES-PAGE-COPY.md"
CheckFile "docs/TESTING.md" "$basePath\docs\TESTING.md"

# --- SCRIPTS ---
CheckFile "scripts/setup-env.sh" "$basePath\scripts\setup-env.sh"
CheckFile "scripts/seed.sh" "$basePath\scripts\seed.sh"
CheckFile "scripts/backup-db.sh" "$basePath\scripts\backup-db.sh"
CheckFile "scripts/restore-db.sh" "$basePath\scripts\restore-db.sh"
CheckFile "scripts/publish-github.sh" "$basePath\scripts\publish-github.sh"
CheckFile "scripts/qa-local.sh" "$basePath\scripts\qa-local.sh"
CheckFile "scripts/start.sh" "$basePath\scripts\start.sh"
CheckFile "scripts/add-tickets.mjs" "$basePath\scripts\add-tickets.mjs"

# --- COOLIFY ---
CheckFile "coolify/README.md" "$basePath\coolify\README.md"

# --- Summary ---
Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Passed: $($success.Count)" -ForegroundColor Green
Write-Host "Warnings: $($warnings.Count)" -ForegroundColor Yellow
Write-Host "Errors: $($errors.Count)" -ForegroundColor Red

if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "WARNINGS:" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
}

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "ERRORS (Missing Required Files):" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    exit 1
} else {
    Write-Host ""
    Write-Host "ALL CHECKS PASSED!" -ForegroundColor Green
    exit 0
}