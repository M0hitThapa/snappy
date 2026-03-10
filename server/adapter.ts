import { drizzle } from "drizzle-orm/postgres-js";

import postgres from "postgres";
import { z } from "zod";

import { sessionTable, userRelations, userTable } from "./db/schemas/auth";
import { postRelations, postsTable } from "./db/schemas/posts";
import { commentRelations, commentsTable } from "./db/schemas/comments";
import { commentUpvoteRelation, commentUpvotesTable, postUpvotesRelation, postUpvotesTable } from "./db/schemas/upvotes";

const EnvSchema = z.object({
  DATABASE_URL: z.url(),
});

const processEnv = EnvSchema.parse(process.env);

const queryClient = postgres(processEnv.DATABASE_URL);
export const db = drizzle(queryClient, {
  schema: {
    user: userTable,
    session: sessionTable,
    posts: postsTable,
    comments: commentsTable,
    postsUpvotes: postUpvotesTable,
    commentUpvotes: commentUpvotesTable,
    postRelations,
    postUpvotesRelation,
    commentUpvoteRelation,
    commentRelations,
    userRelations
  },
});
