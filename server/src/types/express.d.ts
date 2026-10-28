export type AppRole = "USER" | "AUTHOR" | "ADMIN";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: AppRole;
      };
    }
  }
}

export {};
