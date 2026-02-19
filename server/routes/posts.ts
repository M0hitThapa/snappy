import { Hono } from "hono";
import { and, asc, countDistinct, desc, eq, sql } from "drizzle-orm";

import { db } from "@/adapter";
import { userTable } from "@/db/schemas/auth";
import { postsTable } from "@/db/schemas/posts";
import { postUpvotesTable } from "@/db/schemas/upvotes";
import { authMiddleware } from "@/middleware/auth-middleware";
import type { Context } from "@/utils/context";
import { zValidator } from "@hono/zod-validator";

import {
  createPostSchema,
  paginationSchema,
  type SuccessMessage,
} from "@/shared/types";
import { getISOFormatDateQuery } from "@/lib/utils";

export const postRouter = new Hono<Context>().post(
  "/",
  authMiddleware,
  zValidator("form", createPostSchema),
  async (c) => {
    const { title, url, content } = c.req.valid("form");
    const user = c.get("user")!;
    const [post] = await db
      .insert(postsTable)
      .values({
        title,
        content,
        url,
        userId: user.id,
      })
      .returning({ id: postsTable.id });

    if (!post) {
      return c.json({ success: false, message: "Failed to create post" }, 500);
    }

    return c.json<SuccessMessage<{ postId: number }>>(
      {
        success: true,
        message: "Post created",
        data: { postId: post.id },
      },
      201,
    );
  },
);
