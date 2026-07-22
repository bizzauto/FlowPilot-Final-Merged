import fs from "fs";

const schemaPath = "prisma/schema.prisma";

let schema = fs.readFileSync(schemaPath, "utf8");

if (schema.includes("model Ticket")) {
  console.log("Ticket models already exist.");
  process.exit(0);
}

const models = `

model Ticket {
  id             String          @id @default(cuid())
  organizationId String
  contactId      String?
  subject        String
  status         String          @default("OPEN")
  priority       String          @default("MEDIUM")
  messages       TicketMessage[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId, status])
  @@index([organizationId, createdAt])
}

model TicketMessage {
  id         String @id @default(cuid())
  ticketId   String
  body       String
  authorType String @default("USER")

  ticket Ticket @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([ticketId, createdAt])
}
`;

schema += models;

fs.writeFileSync(schemaPath, schema);

console.log("Ticket models added to prisma/schema.prisma");