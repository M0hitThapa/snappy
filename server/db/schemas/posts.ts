import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { userTable } from "./auth";
import {  postUpvotesTable } from "./upvotes";
import { commentsTable } from "./comments";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";


export const postsTable = pgTable("posts", {
    id:serial("id").primaryKey(),
    userId:text("user_id").notNull(),
    title:text("title").notNull(),
    url:text("text"),
    content:text("content"),
    points:integer("points").default(0).notNull(),
    commentsCount:integer("comment_count").default(0).notNull(),
    createdAt:timestamp("created_at", {
        withTimezone:true,

    }).defaultNow().notNull()

})

export const insertPostSchema = createInsertSchema(postsTable, {
    title:z.string().min(3, {message:"title must have at least 3 characters"}),
    url:z.url({message:"url must be a valid URL"}).optional().or(z.literal("")),
    content:z.string().optional()
})


export const postRelations = relations(postsTable, ({one,many}) =>({
    author: one(userTable, {
        fields:[postsTable.userId],
        references:[userTable.id],
        relationName:"author",
    }),
    postUpvotesTable:many(postUpvotesTable, {
        relationName:"postUpvotes"
    }),
    comments:many(commentsTable)
}))