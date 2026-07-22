FlowPilot Final Folder Structure

flowpilot-final/
  docker-compose.yml
  .env.example
  .gitignore
  README.md
  README-PRODUCTION.md

  coolify/
    README.md

  docs/
    COOLIFY.md
    TESTING.md
    ONBOARDING.md
    QA-TEST-SCRIPTS.md
    FINAL-BUGFIX-AUDIT.md

  scripts/
    setup-env.sh
    start.sh
    seed.sh
    publish-github.sh
    backup-db.sh
    restore-db.sh
    add-tickets.mjs
    qa-local.sh

  backups/
    .gitkeep

  web/
    Dockerfile
    .dockerignore
    package.json
    tsconfig.json
    next.config.js
    middleware.ts

    prisma/
      schema.prisma

    public/
      sw.js

    workers/
      message-worker.ts
      campaign-worker.ts
      automation-worker.ts
      email-worker.ts

    scripts/
      seed.ts
      create-api-key.ts

    lib/
      prisma.ts
      redis.ts
      queue.ts
      logger.ts
      api-error.ts
      rate-limit.ts
      auth.ts
      auth-options.ts
      rbac.ts
      tenant.ts
      secure-api.ts
      api-key-auth.ts
      n8n.ts
      org.ts
      whatsapp/
        signature.ts

    components/
      Sidebar.tsx
      Topbar.tsx
      StatCard.tsx
      EmptyState.tsx
      OrgSwitcher.tsx
      MobileNav.tsx
      PWARegister.tsx

    app/
      layout.tsx
      page.tsx
      globals.css
      manifest.ts
      icon.svg
      not-found.tsx

      login/
        page.tsx

      pricing/
        page.tsx

      l/
        [slug]/
          page.tsx

      api/
        health/
          route.ts

        auth/
          [...nextauth]/
            route.ts

        whatsapp/
          webhook/
            route.ts

        billing/
          razorpay/
            order/
              route.ts
            verify/
              route.ts
            webhook/
              route.ts

        public/
          contacts/
            route.ts
          messages/
            route.ts

        v1/
          me/
            route.ts

          organizations/
            route.ts

          contacts/
            route.ts
            export/
              route.ts
            import/
              route.ts

          conversations/
            route.ts
            [id]/
              messages/
                route.ts

          campaigns/
            route.ts
            [id]/
              queue/
                route.ts

          workflows/
            route.ts
            [id]/
              run/
                route.ts

          analytics/
            route.ts
            advanced/
              route.ts

          api-keys/
            route.ts
            [id]/
              revoke/
                route.ts

          whatsapp-templates/
            route.ts
            [id]/
              status/
                route.ts

          members/
            route.ts
            [id]/
              role/
                route.ts

          agency/
            clients/
              route.ts

          whitelabel/
            route.ts

          billing/
            status/
              route.ts
            subscriptions/
              route.ts
              [id]/
                cancel/
                  route.ts

          tickets/
            route.ts
            [id]/
              route.ts
              messages/
                route.ts

          demo/
            generate/
              route.ts

          onboarding/
            status/
              route.ts

      (dashboard)/
        layout.tsx
        loading.tsx

        welcome/
          page.tsx

        dashboard/
          page.tsx

        analytics/
          page.tsx

        inbox/
          page.tsx

        contacts/
          page.tsx

        pipeline/
          page.tsx

        campaigns/
          page.tsx

        broadcast/
          page.tsx

        automations/
          page.tsx

        automation-builder/
          page.tsx

        support/
          page.tsx
          [id]/
            page.tsx

        billing-portal/
          page.tsx

        agency-wizard/
          page.tsx

        design/
          page.tsx

        reports/
          page.tsx

        settings/
          layout.tsx
          page.tsx

          whatsapp/
            page.tsx

          whatsapp-templates/
            page.tsx

          api-keys/
            page.tsx

          team/
            page.tsx

          agency/
            page.tsx

          white-label/
            page.tsx

          organization/
            page.tsx

          billing/
            page.tsx

          testing/
            page.tsx

          deployment/
            page.tsx

          production/
            page.tsx