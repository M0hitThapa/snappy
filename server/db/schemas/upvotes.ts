import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const postUpvotesTable = pgTable("postupvotestable", {
    id:serial("id").primaryKey(),
    userId:text("user_id").notNull(),
    postId:integer("post_id").notNull(),
    createdAt:timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
})




export const commentUpvotesTable = pgTable("commentupvotetable", {
    id:serial("id").primaryKey(),
    userId:text("user_id").notNull(),
    commentId:integer("comment_id").notNull(),
    createdAt:timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
})