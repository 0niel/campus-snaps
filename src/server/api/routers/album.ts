import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const albumRouter = createTRPCRouter({
  /**
   * Get all albums with optional filters
   */
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.number().optional(),
        ownerId: z.string().optional(),
        academicGroupId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, ownerId, academicGroupId } = input;

      const albums = await ctx.db.album.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        where: {
          ...(ownerId ? { ownerId } : {}),
          ...(academicGroupId ? { academicGroupId } : {}),
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
        include: {
          owner: true,
          academicGroup: true,
          photos: {
            take: 4,
            include: {
              photo: {
                include: {
                  user: true,
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
   * Get a single album by ID
   */
  getById: publicProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;

      const album = await ctx.db.album.findUnique({
        where: { id },
        include: {
          owner: true,
          academicGroup: true,
          photos: {
            include: {
              photo: {
                include: {
                  user: true,
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
            orderBy: {
              photo: {
                uploadDate: "desc",
              },
            },
          },
          events: {
            include: {
              event: true,
            },
          },
        },
      });

      if (!album) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Альбом не найден",
        });
      }

      if (album.privacy !== "public") {
        if (!ctx.session?.user) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "У вас нет доступа к этому альбому",
          });
        }

        const userId = ctx.session.user.id;
        const userAcademicGroupId = ctx.session.user.academicGroupId;

        const isOwner = album.ownerId === userId;
        const isGroupMember = album.academicGroupId === userAcademicGroupId;

        const hasCustomAccess = await ctx.db.albumAllowedUser.findFirst({
          where: {
            albumId: id,
            userId,
          },
        });

        if (album.privacy === "private" && !isOwner) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "У вас нет доступа к этому альбому",
          });
        } else if (album.privacy === "group" && !isOwner && !isGroupMember) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Этот альбом доступен только членам группы",
          });
        } else if (album.privacy === "custom" && !isOwner && !hasCustomAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "У вас нет доступа к этому альбому",
          });
        }
      }

      return album;
    }),

  /**
   * Create a new album
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        coverImage: z.string().optional(),
        privacy: z
          .enum(["public", "private", "group", "custom"])
          .default("public"),
        academicGroupId: z.number().optional(),
        photoIds: z.array(z.number()).default([]),
        allowedUserIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        title,
        description,
        coverImage,
        privacy,
        academicGroupId,
        photoIds,
        allowedUserIds,
      } = input;

      if (
        academicGroupId &&
        ctx.session.user.academicGroupId !== academicGroupId
      ) {
        if (
          ctx.session.user.role !== "ADMIN" &&
          ctx.session.user.role !== "TEACHER"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Вы можете создавать альбомы только для своей группы",
          });
        }
      }

      const album = await ctx.db.album.create({
        data: {
          title,
          description,
          coverImage,
          privacy,
          ownerId: ctx.session.user.id,
          ...(academicGroupId ? { academicGroupId } : {}),
        },
      });

      if (photoIds.length > 0) {
        for (const photoId of photoIds) {
          const photoExists = await ctx.db.photo.findUnique({
            where: { id: photoId },
          });

          if (photoExists) {
            await ctx.db.albumPhoto.create({
              data: {
                albumId: album.id,
                photoId,
              },
            });
          }
        }
      }

      if (privacy === "custom" && allowedUserIds && allowedUserIds.length > 0) {
        for (const userId of allowedUserIds) {
          const userExists = await ctx.db.user.findUnique({
            where: { id: userId },
          });

          if (userExists) {
            await ctx.db.albumAllowedUser.create({
              data: {
                albumId: album.id,
                userId,
              },
            });
          }
        }
      }

      return album;
    }),

  /**
   * Update an existing album
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        coverImage: z.string().optional(),
        privacy: z.enum(["public", "private", "group", "custom"]).optional(),
        academicGroupId: z.number().nullish(),
        photoIds: z.array(z.number()).optional(),
        allowedUserIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        id,
        title,
        description,
        coverImage,
        privacy,
        academicGroupId,
        photoIds,
        allowedUserIds,
      } = input;

      const album = await ctx.db.album.findUnique({
        where: { id },
        include: { owner: true },
      });

      if (!album) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Альбом не найден",
        });
      }

      if (
        album.ownerId !== ctx.session.user.id &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "У вас нет прав на редактирование этого альбома",
        });
      }

      const updatedAlbum = await ctx.db.album.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(coverImage && { coverImage }),
          ...(privacy && { privacy }),
          ...(academicGroupId !== undefined && { academicGroupId }),
        },
      });

      if (photoIds) {
        await ctx.db.albumPhoto.deleteMany({
          where: { albumId: id },
        });

        for (const photoId of photoIds) {
          await ctx.db.albumPhoto.create({
            data: {
              albumId: id,
              photoId,
            },
          });
        }
      }

      if (privacy === "custom" && allowedUserIds) {
        await ctx.db.albumAllowedUser.deleteMany({
          where: { albumId: id },
        });

        for (const userId of allowedUserIds) {
          await ctx.db.albumAllowedUser.create({
            data: {
              albumId: id,
              userId,
            },
          });
        }
      }

      return updatedAlbum;
    }),

  /**
   * Delete an album
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const album = await ctx.db.album.findUnique({
        where: { id },
      });

      if (!album) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Альбом не найден",
        });
      }

      if (
        album.ownerId !== ctx.session.user.id &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "У вас нет прав на удаление этого альбома",
        });
      }

      await ctx.db.albumPhoto.deleteMany({ where: { albumId: id } });
      await ctx.db.albumEvent.deleteMany({ where: { albumId: id } });
      await ctx.db.albumAllowedUser.deleteMany({ where: { albumId: id } });

      await ctx.db.album.delete({ where: { id } });

      return { success: true };
    }),

  /**
   * Add a photo to an album
   */
  addPhoto: protectedProcedure
    .input(
      z.object({
        albumId: z.number(),
        photoId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { albumId, photoId } = input;

      const album = await ctx.db.album.findUnique({
        where: { id: albumId },
      });

      if (!album) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Альбом не найден",
        });
      }

      if (
        album.ownerId !== ctx.session.user.id &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "У вас нет прав на редактирование этого альбома",
        });
      }

      const photo = await ctx.db.photo.findUnique({
        where: { id: photoId },
      });

      if (!photo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Фотография не найдена",
        });
      }

      const existing = await ctx.db.albumPhoto.findUnique({
        where: {
          albumId_photoId: {
            albumId,
            photoId,
          },
        },
      });

      if (existing) {
        return { success: true, message: "Фотография уже добавлена в альбом" };
      }

      await ctx.db.albumPhoto.create({
        data: {
          albumId,
          photoId,
        },
      });

      return { success: true };
    }),

  /**
   * Remove a photo from an album
   */
  removePhoto: protectedProcedure
    .input(
      z.object({
        albumId: z.number(),
        photoId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { albumId, photoId } = input;

      const album = await ctx.db.album.findUnique({
        where: { id: albumId },
      });

      if (!album) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Альбом не найден",
        });
      }

      if (
        album.ownerId !== ctx.session.user.id &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "У вас нет прав на редактирование этого альбома",
        });
      }

      await ctx.db.albumPhoto.delete({
        where: {
          albumId_photoId: {
            albumId,
            photoId,
          },
        },
      });

      return { success: true };
    }),
});
