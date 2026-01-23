import type { Env } from "hono";

export interface User {
  id: string;
  username: string;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
}

export interface Context extends Env {
  Variables: {
    user: User | null;
    session: Session | null;
  };
}
