import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { ApiError } from "@/lib/api-error";

export async function requireSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new ApiError(401, "Unauthorized", "UNAUTHORIZED");
  }

  return session;
}