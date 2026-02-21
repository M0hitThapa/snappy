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
  type PaginationResponse,
  type Post,
  type SuccessMessage,
} from "@/shared/types";
import { getISOFormatDateQuery } from "@/lib/utils";

export const postRouter = new Hono<Context>()
  .post(
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
        return c.json(
          { success: false, message: "Failed to create post" },
          500,
        );
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
  ).get('/', zValidator("query", paginationSchema), async(c) => {
    const {limit, page, site, sortBy, order, author} = c.req.valid("query");
    const user =c.get("user")

    const offset = (page -1 ) * limit

    const sortByColumn = sortBy === "points" ? postsTable.points : postsTable.createdAt
    const sortOrder = order === "desc" ? desc(sortByColumn) : asc(sortByColumn)

    const [count] = await db.select({count:countDistinct(postsTable.id)}).from(postsTable)
    .where(
      and(
        author ? eq(postsTable.userId, author):undefined,
        site ? eq(postsTable.url, site): undefined
      )
    )

    if (!count) {
      return c.json(
        { success: false, message: "Failed to fetch posts" },
        500,
      );
    }
const postQuery =  db.select({
  id:postsTable.id,
  title:postsTable.title,
  url:postsTable.url,
  points:postsTable.points,
  createdAt:getISOFormatDateQuery(postsTable.createdAt),
  commentCount:postsTable.commentsCount,
  author: {
    username:userTable.username,
    id:userTable.id
  },
  isUpvoted: user ? sql<boolean>`CASE WHEN ${postUpvotesTable.userId} IS NOT NULL THEN true ELSE false END`:sql<boolean> `false`


}).from(postsTable).leftJoin(userTable, eq(postsTable.userId, userTable.id)).orderBy(sortOrder).limit(limit).offset(offset)
.where(and(
  author ? eq(postsTable.userId, author): undefined,
  site ? eq(postsTable.url, site) : undefined
))


if(user) {
  postQuery.leftJoin(
    postUpvotesTable, 
      and(
        eq(postUpvotesTable.postId, postsTable.id),
        eq(postUpvotesTable.userId, user.id)
      )
    
  )
}

const posts = await postQuery;

return c.json<PaginationResponse<Post[]>>({
  data:posts as Post[],
  success:true,
  message:"posts fetched",
  pagination:{
    page:page,
    totalPage:Math.ceil(count.count / limit) as number
  }
}, 200)

  })
 
