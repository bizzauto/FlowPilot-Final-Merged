import fs from "fs";

const requiredFiles = [
  "../docs/feature-expansion/00-master-plan.md",
  "lib/whatsapp/provider.ts",
  "lib/whatsapp/evolution-provider.ts",
  "lib/whatsapp/meta-provider.ts",
  "lib/leads/importer.ts",
  "lib/leads/dedupe.ts",
  "lib/leads/scoring.ts",
  "lib/posters/renderer.ts",
  "lib/automations/engine.ts",
  "app/api/v1/leads/route.ts",
  "app/api/v1/leads/import/route.ts",
  "app/api/v1/posters/route.ts",
  "app/api/v1/broadcasts-advanced/route.ts",
  "app/api/v1/drip/route.ts",
  "app/api/v1/whatsapp/instances/route.ts",
  "app/(dashboard)/leads/page.tsx",
  "app/(dashboard)/posters/page.tsx",
  "app/(dashboard)/broadcast-advanced/page.tsx",
  "app/(dashboard)/drip/page.tsx",
  "workers/broadcast-worker.ts",
  "workers/drip-worker.ts",
  "workers/lead-sync-worker.ts",
  "workers/poster-worker.ts",
];

let failed = 0;

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log("OK: " + file);
  } else {
    console.log("MISSING: " + file);
    failed = 1;
  }
}

const schema = fs.readFileSync("prisma/schema.prisma", "utf8");

const models = [
  "Lead",
  "WhatsAppInstance",
  "PosterTemplate",
  "Poster",
  "BroadcastAdvanced",
  "BroadcastMessage",
  "DripSequence",
  "DripStep",
  "DripEnrollment",
];

for (const model of models) {
  if (schema.includes("model " + model)) {
    console.log("OK MODEL: " + model);
  } else {
    console.log("MISSING MODEL: " + model);
    failed = 1;
  }
}

if (failed) {
  console.log("Feature expansion test FAILED.");
  process.exit(1);
}

console.log("Feature expansion test PASSED.");