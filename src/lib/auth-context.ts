import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export interface UserContext {
  user: User;
  userId: string;
}

export async function getCurrentUserContext(): Promise<UserContext | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return null;
  }

  return { user, userId: user.id };
}

export async function requireUserContext(): Promise<UserContext> {
  const context = await getCurrentUserContext();
  if (!context) {
    throw new Error("Unauthorized");
  }
  return context;
}
