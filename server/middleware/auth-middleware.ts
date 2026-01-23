import type { Context } from "hono";
import { eq } from "drizzle-orm";

import { db } from "@/adapter";
import { sessionTable, userTable } from "@/db/schemas/auth";
import { constantTimeEqual, hashSecret } from "@/utils/session";
import cookie from "cookie";

export const authMiddleware = async (c: Context, next: () => Promise<void>) => {
  const cookies = cookie.parse(c.req.header("Cookie") ?? "");
  const token = cookies["session_token"];

  if (!token) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  const [sessionId, secret] = token.split(".");
  if (!sessionId || !secret) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  const session = await db
    .select()
    .from(sessionTable)
    .where(eq(sessionTable.id, sessionId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!session || session.expiresAt.getTime() < Date.now()) {
    c.set("session", null);
    c.set("user", null);
    return next();
  }

  const validSecret = constantTimeEqual(hashSecret(secret), session.secretHash);
  if (!validSecret) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  const user = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, session.userId))
    .limit(1)
    .then((rows) => rows[0]);

  c.set("user", user ? { id: user.id, username: user.username } : null);
  c.set("session", session);

  c.header(
    "Set-Cookie",
    cookie.serialize("session_token", token, {
      path: "/",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    }),
  );
  await next();
};
