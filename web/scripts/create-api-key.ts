import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashApiKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

async function main() {
  const orgSlug = process.argv[2] || "acme";
  const keyName = process.argv[3] || "n8n";

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!organization) {
    throw new Error(`Organization not found: ${orgSlug}`);
  }

  const rawKey = `fp_live_${crypto.randomBytes(32).toString("hex")}`;
  const prefix = rawKey.slice(0, 12);
  const keyHash = hashApiKey(rawKey);

  await prisma.apiKey.create({
    data: {
      organizationId: organization.id,
      name: keyName,
      prefix,
      keyHash,
      scopes: ["*"],
    },
  });

  console.log("API key created");
  console.log(rawKey);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });