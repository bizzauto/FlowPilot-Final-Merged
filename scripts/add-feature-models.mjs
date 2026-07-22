import fs from "fs";
import path from "path";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");

if (!fs.existsSync(schemaPath)) {
  console.error("ERROR: prisma/schema.prisma not found.");
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, "utf8");

if (schema.includes("model Lead")) {
  console.log("Feature models already exist. Skipping.");
  process.exit(0);
}

const models = `

model Lead {
  id             String   @id @default(cuid())
  organizationId String
  source         String   @default("MANUAL")
  companyName    String?
  personName     String?
  phone          String?
  email          String?
  city           String?
  state          String?
  category       String?
  requirement    String?
  score          Int      @default(0)
  status         String   @default("NEW")
  consentStatus  String   @default("PENDING")
  rawPayload     Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId, status])
  @@index([organizationId, phone])
  @@index([organizationId, email])
}

model WhatsAppInstance {
  id              String    @id @default(cuid())
  organizationId  String
  provider        String    @default("EVOLUTION")
  name            String
  phoneNumber     String?
  status          String    @default("DISCONNECTED")
  apiKey          String?
  webhookUrl      String?
  qrCode          String?
  lastConnectedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId, provider])
}

model PosterTemplate {
  id             String  @id @default(cuid())
  organizationId String
  name           String
  category       String?
  html           String
  thumbnail      String?
  active         Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId, active])
}

model Poster {
  id             String  @id @default(cuid())
  organizationId String
  templateId     String?
  title          String
  caption        String?
  imageUrl       String?
  status         String  @default("DRAFT")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId, status])
}

model BroadcastAdvanced {
  id             String    @id @default(cuid())
  organizationId String
  name           String
  status         String    @default("DRAFT")
  audience       Json?
  content        Json?
  scheduleAt     DateTime?
  ratePerMinute  Int       @default(30)
  totalRecipients Int      @default(0)
  sentCount      Int       @default(0)
  deliveredCount Int       @default(0)
  readCount      Int       @default(0)
  failedCount    Int       @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId, status])
}

model BroadcastMessage {
  id              String    @id @default(cuid())
  broadcastId     String
  contactId       String?
  phone           String
  status          String    @default("QUEUED")
  providerMessageId String?
  error           String?
  sentAt          DateTime?
  deliveredAt     DateTime?
  readAt          DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([broadcastId, status])
}

model DripSequence {
  id             String  @id @default(cuid())
  organizationId String
  name           String
  trigger        String  @default("lead.created")
  status         String  @default("DRAFT")
  exitConditions Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId, status])
}

model DripStep {
  id         String @id @default(cuid())
  sequenceId String
  stepOrder  Int    @default(1)
  delayValue Int    @default(0)
  delayUnit  String @default("minutes")
  channel    String @default("WHATSAPP")
  content    Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([sequenceId, stepOrder])
}

model DripEnrollment {
  id          String    @id @default(cuid())
  sequenceId  String
  contactId   String
  status      String    @default("ACTIVE")
  currentStep Int       @default(0)
  startedAt   DateTime  @default(now())
  completedAt DateTime?
  exitReason  String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([sequenceId, status])
}
`;

schema += models;

fs.writeFileSync(schemaPath, schema);

console.log("Feature models added to prisma/schema.prisma");