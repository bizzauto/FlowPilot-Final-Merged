import crypto from "crypto";

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) return true;
  if (!signatureHeader) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signatureHeader);

  if (expectedBuffer.length !== providedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}