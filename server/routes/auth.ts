import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";

import { db } from "@/adapter";
import { sessionTable, userTable } from "@/db/schemas/auth";
import type { Context } from "@/utils/context";
import { generateSecureRandomString, hashSecret } from "@/utils/session";
import { zValidator } from "@hono/zod-validator";
import cookie from "cookie";
import postgres from "postgres";

import { LoginSchema, type SuccessMessage } from "@/shared/types";
import { authMiddleware } from "@/middleware/auth-middleware";

export const authRouter = new Hono<Context>()
  .post("/signup", zValidator("form", LoginSchema), async (c) => {
    const { username, password } = c.req.valid("form");
    const passwordHash = await Bun.password.hash(password);
    const userId = generateSecureRandomString(15);

    try {
      await db.insert(userTable).values({
        id: userId,
        username,
        password_hash: passwordHash,
      });

      const sessionId = generateSecureRandomString(24);
      const secret = generateSecureRandomString(24);
      const secretHash = hashSecret(secret);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.insert(sessionTable).values({
        id: sessionId,
        userId,
        secretHash,
        expiresAt,
      });
      const token = `${sessionId}.${secret}`;
      c.header(
        "Set-Cookie",
        cookie.serialize("session_token", token, {
          path: "/",
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        }),
      );
      return c.json<SuccessMessage>(
        {
          success: true,
          message: "User Created",
        },
        201,
      );
    } catch (error) {
      if (error instanceof postgres.PostgresError && error.code === "23505") {
        throw new HTTPException(409, {
          message: "Username already used",
          cause: { form: true },
        });
      }
      throw new HTTPException(500, { message: "Failed to create user" });
    }
  })
  .post("/login", zValidator("form", LoginSchema), async (c) => {
    const { username, password } = c.req.valid("form");

    const [existingUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.username, username))
      .limit(1);
    if (!existingUser) {
      throw new HTTPException(401, {
        message: "Incorrect username",
      });
    }
    const validPassword = await Bun.password.verify(
      password,
      existingUser.password_hash,
    );

    if (!validPassword) {
      throw new HTTPException(401, {
        message: "password incorrect",
      });
    }

    const sessionId = generateSecureRandomString(24);
    const secret = generateSecureRandomString(24);
    const secretHash = hashSecret(secret);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(sessionTable).values({
      id: sessionId,
      userId: existingUser.id,
      secretHash,
      expiresAt,
    });

    const token = `${sessionId}.${secret}`;
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

    return c.json<SuccessMessage>({
      success: true,
      message: "Logged In successfully",
    }, 200);
  }).get("/logout", authMiddleware, async (c) => {
    const session = c.get("session");
    if (!session) return c.redirect("/");

    await db.delete(sessionTable).where(eq(sessionTable.id,session.id));

    c.header(
      "Set-Cookie",
      cookie.serialize("session_token", "", { path: "/", maxAge: 0 })
    );
    return c.redirect("/");
  }).get("/users", authMiddleware, async (c) => {
    const user = c.get("user")!
    return c.json<SuccessMessage<{username:string}>>({
      success:true,
      message:"User fetched",
      data:{username:user.username}
    })
  })
