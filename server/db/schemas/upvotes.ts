import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { postsTable } from "./posts";
import { userTable } from "./auth";
import { commentsTable } from "./comments";

export const postUpvotesTable = pgTable("postupvotestable", {
    id:serial("id").primaryKey(),
    userId:text("user_id").notNull(),
    postId:integer("post_id").notNull(),
    createdAt:timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
})


export const postUpvotesRelation = relations(postUpvotesTable, ({one}) => ({
post:one(postsTable, {
    fields:[postUpvotesTable.postId],
    references:[postsTable.id],
    relationName:"postUpvotes"
}),
user:one(userTable,{
    fields:[postUpvotesTable.userId],
    references:[userTable.id],
    relationName:"user"
} ) 
}));



export const commentUpvotesTable = pgTable("commentupvotetable", {
    id:serial("id").primaryKey(),
    userId:text("user_id").notNull(),
    commentId:integer("comment_id").notNull(),
    createdAt:timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
})

export const commentUpvoteRelation = relations(commentUpvotesTable, ({one}) => ({
    post:one(commentsTable, {
        fields:[commentUpvotesTable.commentId],
        references:[commentsTable.id],
        relationName:"commentUpvotes"
    }),
    user:one(userTable, {
        fields:[commentUpvotesTable.userId],
        references:[userTable.id],
        relationName:"user"
    })
}))