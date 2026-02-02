import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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