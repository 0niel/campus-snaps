import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  /**
   * Get user profile by ID
   */
  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;

      const user = await ctx.db.user.findUnique({
        where: { id },
        include: {
          academicGroup: true,
          _count: {
            select: {
              photos: true,
              followers: true,
              following: true,
              albums: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Пользователь не найден",
        });
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        academicGroup: user.academicGroup,
        createdAt: user.createdAt,
        _count: user._count,
      };
    }),

  /**
   * Get user's photos
   */
  getPhotos: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, limit, cursor } = input;

      const photos = await ctx.db.photo.findMany({
        where: { userId },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { uploadDate: "desc" },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          likes: {
            select: { userId: true },
          },
          comments: {
            select: { id: true },
          },
          event: true,
        },
      });

      let nextCursor: number | undefined = undefined;

      if (photos.length > limit) {
        const nextItem = photos.pop();
        nextCursor = nextItem!.id;
      }

      return {
        photos,
        nextCursor,
      };
    }),

  /**
   * Get user's albums
   */
  getAlbums: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, limit, cursor } = input;

      const albums = await ctx.db.album.findMany({
        where: {
          ownerId: userId,
          OR: [
            { privacy: "public" },
            ...(ctx.session?.user
              ? [
                  { ownerId: ctx.session.user.id },
                  {
                    academicGroupId: ctx.session.user.academicGroupId as
                      | number
                      | null,
                  },
                  {
                    allowedUsers: {
                      some: {
                        userId: ctx.session.user.id,
                      },
                    },
                  },
                ]
              : []),
          ],
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          photos: {
            take: 4,
            include: {
              photo: {
                include: {
                  tags: {
                    include: {
                      tag: true,
                    },
                  },
                  likes: {
                    select: { userId: true },
                  },
                  comments: {
                    select: { id: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              photos: true,
            },
          },
        },
      });

      let nextCursor: number | undefined = undefined;

      if (albums.length > limit) {
        const nextItem = albums.pop();
        nextCursor = nextItem!.id;
      }

      return {
        albums,
        nextCursor,
      };
    }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        image: z.string().optional(),
        academicGroupId: z.number().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, image, academicGroupId } = input;

      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          ...(name && { name }),
          ...(image && { image }),
          ...(academicGroupId !== undefined && { academicGroupId }),
        },
        include: {
          academicGroup: true,
        },
      });

      return {
        id: user.id,
        name: user.name,
        image: user.image,
        academicGroupId: user.academicGroupId,
        academicGroup: user.academicGroup,
      };
    }),

  /**
   * Follow a user
   */
  follow: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = input;

      if (userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Вы не можете подписаться на самого себя",
        });
      }

      const userExists = await ctx.db.user.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Пользователь не найден",
        });
      }

      const existingFollow = await ctx.db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: ctx.session.user.id,
            followingId: userId,
          },
        },
      });

      if (existingFollow) {
        await ctx.db.follow.delete({
          where: {
            followerId_followingId: {
              followerId: ctx.session.user.id,
              followingId: userId,
            },
          },
        });

        return { followed: false };
      }

      await ctx.db.follow.create({
        data: {
          followerId: ctx.session.user.id,
          followingId: userId,
        },
      });

      return { followed: true };
    }),

  /**
   * Check if current user is following another user
   */
  isFollowing: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId } = input;

      const follow = await ctx.db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: ctx.session.user.id,
            followingId: userId,
          },
        },
      });

      return { following: !!follow };
    }),

  /**
   * Get followers or following users
   */
  getConnections: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        type: z.enum(["followers", "following"]),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, type, limit, cursor } = input;

      if (type === "followers") {
        const followers = await ctx.db.follow.findMany({
          where: { followingId: userId },
          take: limit + 1,
          cursor: cursor
            ? {
                followerId_followingId: {
                  followerId: cursor,
                  followingId: userId,
                },
              }
            : undefined,
          include: {
            follower: {
              include: {
                academicGroup: true,
              },
            },
          },
        });

        let nextCursor: string | undefined = undefined;

        if (followers.length > limit) {
          const nextItem = followers.pop();
          nextCursor = nextItem!.followerId;
        }

        return {
          users: followers.map((f) => f.follower),
          nextCursor,
        };
      } else {
        const following = await ctx.db.follow.findMany({
          where: { followerId: userId },
          take: limit + 1,
          cursor: cursor
            ? {
                followerId_followingId: {
                  followerId: userId,
                  followingId: cursor,
                },
              }
            : undefined,
          include: {
            following: {
              include: {
                academicGroup: true,
              },
            },
          },
        });

        let nextCursor: string | undefined = undefined;

        if (following.length > limit) {
          const nextItem = following.pop();
          nextCursor = nextItem!.followingId;
        }

        return {
          users: following.map((f) => f.following),
          nextCursor,
        };
      }
    }),

  /**
   * Search users
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;

      const users = await ctx.db.user.findMany({
        where: {
          OR: [{ name: { contains: query } }, { email: { contains: query } }],
        },
        take: limit,
        include: {
          academicGroup: true,
        },
      });

      return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        academicGroup: user.academicGroup,
      }));
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      include: {
        academicGroup: true,
      },
    });

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    const photosCount = await ctx.db.photo.count({
      where: { userId },
    });

    const eventsCount = 0;

    const likesCount = await ctx.db.like.count({
      where: { userId },
    });

    return {
      user,
      stats: {
        photosCount,
        eventsCount,
        likesCount,
      },
    };
  }),

  getUserById: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          academicGroup: true,
        },
      });

      if (!user) {
        throw new Error("Пользователь не найден");
      }

      const photosCount = await ctx.db.photo.count({
        where: { userId: input.userId },
      });

      const eventsCount = 0;

      const likesCount = await ctx.db.like.count({
        where: { userId: input.userId },
      });

      return {
        user,
        stats: {
          photosCount,
          eventsCount,
          likesCount,
        },
      };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Имя не может быть пустым"),
        bio: z.string().optional(),
        academicGroupId: z.number().optional(),
        image: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const user = await ctx.db.user.update({
        where: { id: userId },
        data: {
          name: input.name,
          bio: input.bio,
          academicGroupId: input.academicGroupId,
          image: input.image,
        },
      });

      return { user };
    }),

  getAcademicGroups: publicProcedure.query(async ({ ctx }) => {
    const groups = await ctx.db.academicGroup.findMany({
      orderBy: { name: "asc" },
    });

    return { groups };
  }),
});
