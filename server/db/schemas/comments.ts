import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const Comments = pgTable("comments", {
    id:serial("id").primaryKey(),
    userId:text("user_id").notNull(),
    postId:integer("post_id").notNull(),
    parentCommentId:integer("parent_comment_id"),
    content:text("content").notNull(),
    createdAt:timestamp("created_at", {
        withTimezone:true
    }).notNull().defaultNow(),
    depth:integer("depth").default(0).notNull(),
    commentCount:integer("comment_count").notNull().default(0),
    points:integer("points").default(0).notNull(),

})