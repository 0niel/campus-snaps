import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const groupRouter = createTRPCRouter({
  /**
   * Get all academic groups
   */
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.number().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search } = input;

      const groups = await ctx.db.academicGroup.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { name: "asc" },
        where: search
          ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
          : undefined,
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      let nextCursor: number | undefined = undefined;

      if (groups.length > limit) {
        const nextItem = groups.pop();
        nextCursor = nextItem!.id;
      }

      const groupsWithPhotos = await Promise.all(
        groups.map(async (group) => {
          const photos = await ctx.db.photo.findMany({
            where: {
              user: {
                academicGroupId: group.id,
              },
            },
            take: 3,
            orderBy: {
              uploadDate: "desc",
            },
            include: {
              user: true,
            },
          });

          const photoCount = await ctx.db.photo.count({
            where: {
              user: {
                academicGroupId: group.id,
              },
            },
          });

          const members = await ctx.db.user.findMany({
            where: {
              academicGroupId: group.id,
            },
            take: 3,
            select: {
              id: true,
              name: true,
              image: true,
            },
          });

          return {
            ...group,
            recentPhotos: photos,
            photoCount,
            members,
          };
        }),
      );

      return {
        groups: groupsWithPhotos,
        nextCursor,
      };
    }),

  /**
   * Get a single academic group by ID
   */
  getById: publicProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;

      const group = await ctx.db.academicGroup.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Группа не найдена",
        });
      }

      const photos = await ctx.db.photo.findMany({
        where: {
          user: {
            academicGroupId: id,
          },
        },
        take: 20,
        orderBy: {
          uploadDate: "desc",
        },
        include: {
          user: true,
          tags: {
            include: {
              tag: true,
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
          comments: {
            select: {
              id: true,
            },
          },
        },
      });

      const photoCount = await ctx.db.photo.count({
        where: {
          user: {
            academicGroupId: id,
          },
        },
      });

      const members = await ctx.db.user.findMany({
        where: {
          academicGroupId: id,
        },
        include: {
          _count: {
            select: {
              photos: true,
            },
          },
        },
      });

      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const activeMembers = await ctx.db.user.findMany({
        where: {
          academicGroupId: id,
          photos: {
            some: {
              uploadDate: {
                gte: lastMonth,
              },
            },
          },
        },
        take: 10,
      });

      return {
        ...group,
        photos,
        photoCount,
        members,
        activeMembers,
        activeCount: activeMembers.length,
      };
    }),

  /**
   * Get community groups (special academic groups like "Student Media Center")
   */
  getCommunities: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.number().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search } = input;

      const communityNames = [
        "Студенческий Медиацентр",
        "Студенческий союз",
        "Спортивный клуб",
        "Научное сообщество",
      ];

      const communities = await ctx.db.academicGroup.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          name: {
            in: communityNames,
            ...(search ? { contains: search, mode: "insensitive" } : {}),
          },
        },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      let nextCursor: number | undefined = undefined;

      if (communities.length > limit) {
        const nextItem = communities.pop();
        nextCursor = nextItem!.id;
      }

      const communitiesWithDetails = await Promise.all(
        communities.map(async (community) => {
          const photos = await ctx.db.photo.findMany({
            where: {
              user: {
                academicGroupId: community.id,
              },
            },
            take: 3,
            orderBy: {
              uploadDate: "desc",
            },
          });

          const photoCount = await ctx.db.photo.count({
            where: {
              user: {
                academicGroupId: community.id,
              },
            },
          });

          const members = await ctx.db.user.findMany({
            where: {
              academicGroupId: community.id,
            },
            take: 3,
            select: {
              id: true,
              name: true,
              image: true,
            },
          });

          const tags = await ctx.db.tag.findMany({
            where: {
              photos: {
                some: {
                  photo: {
                    user: {
                      academicGroupId: community.id,
                    },
                  },
                },
              },
            },
            distinct: ["name"],
            take: 5,
          });

          return {
            ...community,
            type: "community",
            recentPhotos: photos,
            photoCount,
            members,
            tags: tags.map((t) => t.name),
          };
        }),
      );

      return {
        communities: communitiesWithDetails,
        nextCursor,
      };
    }),

  /**
   * Join a group (update user's academicGroupId)
   */
  join: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { groupId } = input;

      const group = await ctx.db.academicGroup.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Группа не найдена",
        });
      }

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          academicGroupId: groupId,
        },
      });

      return { success: true };
    }),

  /**
   * Leave a group (set academicGroupId to null)
   */
  leave: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: {
        academicGroupId: null,
      },
    });

    return { success: true };
  }),
});
