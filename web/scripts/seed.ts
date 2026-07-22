import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashApiKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

async function main() {
  const orgSlug = process.env.DEFAULT_ORG_SLUG || "acme";
  const orgName = process.env.DEFAULT_ORG_NAME || "Acme Inc";
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@flowpilot.local";
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "ChangeAdmin@123";

  const organization = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: {},
    create: {
      name: orgName,
      slug: orgSlug,
    },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Platform Admin",
      email: adminEmail,
      passwordHash,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      organizationId: organization.id,
      role: "OWNER",
      active: true,
    },
  });

  const existingKeys = await prisma.apiKey.count({
    where: {
      organizationId: organization.id,
      revokedAt: null,
    },
  });

  if (existingKeys === 0) {
    const rawKey = `fp_live_${crypto.randomBytes(32).toString("hex")}`;
    const prefix = rawKey.slice(0, 12);
    const keyHash = hashApiKey(rawKey);

    await prisma.apiKey.create({
      data: {
        organizationId: organization.id,
        name: "n8n",
        prefix,
        keyHash,
        scopes: ["*"],
      },
    });

    console.log("====================================");
    console.log("API key created for n8n:");
    console.log(rawKey);
    console.log("Store it securely. It will not be shown again.");
    console.log("====================================");
  }

  console.log("Seed complete");
  console.log("Organization ID:", organization.id);
  console.log("Organization slug:", organization.slug);
  console.log("Admin email:", adminEmail);
  console.log("Admin password:", adminPassword);
  console.log("");
  console.log("Set this in .env:");
  console.log(`DEFAULT_ORGANIZATION_ID=${organization.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });