import { createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "~/server/api/routers/user";
import { photoRouter } from "~/server/api/routers/photo";
import { eventRouter } from "~/server/api/routers/event";
import { groupRouter } from "~/server/api/routers/group";
import { tagRouter } from "~/server/api/routers/tag";
import { uploadRouter } from "./routers/upload";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  photo: photoRouter,
  event: eventRouter,
  group: groupRouter,
  upload: uploadRouter,
  tag: tagRouter,
});

export type AppRouter = typeof appRouter;
