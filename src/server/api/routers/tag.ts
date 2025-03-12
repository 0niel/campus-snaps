import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const tagRouter = createTRPCRouter({
  getPopular: publicProcedure.query(async ({ ctx }) => {
    const tagsWithCount = await ctx.db.tag.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            photos: true,
          },
        },
      },
      orderBy: {
        photos: {
          _count: "desc",
        },
      },
      take: 20,
    });

    const tags = tagsWithCount.map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: tag._count.photos,
    }));

    return { tags };
  }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tags = await ctx.db.tag.findMany({
        where: {
          name: {
            contains: input.query,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              photos: true,
            },
          },
        },
        orderBy: {
          photos: {
            _count: "desc",
          },
        },
        take: input.limit,
      });

      return {
        tags: tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          count: tag._count.photos,
        })),
      };
    }),
});
