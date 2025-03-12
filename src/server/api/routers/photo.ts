import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { generateUniqueFilename, getPresignedUploadUrl } from "~/server/s3";

export const photoRouter = createTRPCRouter({
  /**
   * Get photos for the feed with pagination
   */
  getFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().nullish(),
        tag: z.string().optional(),
        date: z.date().optional(),
        view: z.enum(["all", "groups", "events", "community"]).default("all"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, tag, date, view } = input;

      let photos = await ctx.db.photo.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { uploadDate: "desc" },
        include: {
          user: {
            include: {
              academicGroup: true,
            },
          },
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
          event: true,
        },
        ...(tag
          ? {
              where: {
                tags: {
                  some: {
                    tag: {
                      name: tag,
                    },
                  },
                },
              },
            }
          : {}),
        ...(date
          ? {
              where: {
                uploadDate: {
                  gte: new Date(date.setHours(0, 0, 0, 0)),
                  lt: new Date(date.setHours(23, 59, 59, 999)),
                },
              },
            }
          : {}),
      });

      let albums = await ctx.db.album.findMany({
        take: limit / 2,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            include: {
              academicGroup: true,
            },
          },
          academicGroup: true,
          photos: {
            take: 4,
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
              },
            },
          },
        },
        ...(tag
          ? {
              where: {
                photos: {
                  some: {
                    photo: {
                      tags: {
                        some: {
                          tag: {
                            name: tag,
                          },
                        },
                      },
                    },
                  },
                },
              },
            }
          : {}),
        ...(date
          ? {
              where: {
                OR: [
                  {
                    createdAt: {
                      gte: new Date(date.setHours(0, 0, 0, 0)),
                      lt: new Date(date.setHours(23, 59, 59, 999)),
                    },
                  },
                  {
                    photos: {
                      some: {
                        photo: {
                          uploadDate: {
                            gte: new Date(date.setHours(0, 0, 0, 0)),
                            lt: new Date(date.setHours(23, 59, 59, 999)),
                          },
                        },
                      },
                    },
                  },
                ],
              },
            }
          : {}),
      });

      let events = await ctx.db.event.findMany({
        take: limit / 2,
        orderBy: { date: "desc" },
        include: {
          photos: {
            take: 3,
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
          },
        },
        ...(tag
          ? {
              where: {
                photos: {
                  some: {
                    tags: {
                      some: {
                        tag: {
                          name: tag,
                        },
                      },
                    },
                  },
                },
              },
            }
          : {}),
        ...(date
          ? {
              where: {
                OR: [
                  {
                    date: {
                      gte: new Date(date.setHours(0, 0, 0, 0)),
                      lt: new Date(date.setHours(23, 59, 59, 999)),
                    },
                  },
                  {
                    photos: {
                      some: {
                        uploadDate: {
                          gte: new Date(date.setHours(0, 0, 0, 0)),
                          lt: new Date(date.setHours(23, 59, 59, 999)),
                        },
                      },
                    },
                  },
                ],
              },
            }
          : {}),
      });

      if (view === "events") {
        photos = photos.filter((photo) => photo.eventId !== null);
        albums = albums.filter(
          (album) =>
            album.title?.toLowerCase().includes("мероприятие") ||
            album.title?.toLowerCase().includes("событие") ||
            album.title?.toLowerCase().includes("ивент"),
        );
      } else if (view === "groups") {
        photos = photos.filter((photo) => photo.user.academicGroupId !== null);
        albums = albums.filter((album) => album.academicGroupId !== null);
      } else if (view === "community") {
        const orgNames = ["Студенческий Медиацентр", "Студенческий союз"];
        photos = photos.filter(
          (photo) =>
            photo.user.academicGroup &&
            orgNames.includes(photo.user.academicGroup.name),
        );
        albums = albums.filter(
          (album) =>
            album.academicGroup && orgNames.includes(album.academicGroup.name),
        );
      }

      const userPhotoGroups = new Map<string, { user: any; photos: any[] }>();
      photos.forEach((photo) => {
        if (!userPhotoGroups.has(photo.userId)) {
          userPhotoGroups.set(photo.userId, {
            user: photo.user,
            photos: [photo],
          });
        } else {
          const group = userPhotoGroups.get(photo.userId);
          if (group && group.photos.length < 4) {
            group.photos.push(photo);
          }
        }
      });

      const userPhotosItems = Array.from(userPhotoGroups.values())
        .filter((group) => group.photos.length >= 2)
        .map((group, index) => ({
          id: 3000 + index,
          type: "userPhotos" as const,
          title: `Новое от ${group.user.name}`,
          data: group,
          date: group.photos[0].uploadDate,
        }));

      const groupPhotoMap = new Map<number, { group: any; photos: any[] }>();

      photos.forEach((photo) => {
        if (photo.user.academicGroupId) {
          const groupId = photo.user.academicGroupId;
          if (!groupPhotoMap.has(groupId)) {
            groupPhotoMap.set(groupId, {
              group: photo.user.academicGroup,
              photos: [photo],
            });
          } else {
            const group = groupPhotoMap.get(groupId);
            if (group && group.photos.length < 4) {
              group.photos.push(photo);
            }
          }
        }
      });

      const groupPhotosItems = Array.from(groupPhotoMap.values())
        .filter((group) => group.photos.length >= 2)
        .map((group, index) => ({
          id: 4000 + index,
          type: "groupPhotos" as const,
          title: `От группы ${group.group.name}`,
          data: group,
          date: new Date(
            Math.max(...group.photos.map((p: any) => p.uploadDate.getTime())),
          ),
        }));

      let nextCursor: number | undefined = undefined;
      if (photos.length > limit) {
        const nextItem = photos.pop();
        nextCursor = nextItem?.id;
      }

      const photoItems = photos.map((photo) => ({
        id: photo.id,
        type: "photo" as const,
        data: photo,
        date: photo.uploadDate,
      }));

      const albumItems = albums.map((album) => ({
        id: album.id + 1000,
        type: "album" as const,
        title: album.title,
        data: album,
        date: album.createdAt ?? new Date(),
      }));

      const eventItems = events.map((event) => ({
        id: event.id + 2000,
        type: "event" as const,
        title: event.name,
        data: event,
        date: event.date,
      }));

      const allItems = [
        ...photoItems,
        ...albumItems,
        ...eventItems,
        ...userPhotosItems,
        ...groupPhotosItems,
      ].sort((a, b) => {
        const orgNames = ["Студенческий Медиацентр", "Студенческий союз"];

        const aIsOrg =
          a.type === "userPhotos" &&
          (a.data as any).user.academicGroup &&
          orgNames.includes((a.data as any).user.academicGroup.name);

        const bIsOrg =
          b.type === "userPhotos" &&
          (b.data as any).user.academicGroup &&
          orgNames.includes((b.data as any).user.academicGroup.name);

        if (aIsOrg && !bIsOrg) return -1;
        if (!aIsOrg && bIsOrg) return 1;

        const now = new Date();
        const aIsUpcomingEvent =
          a.type === "event" && (a.data as any).date > now;
        const bIsUpcomingEvent =
          b.type === "event" && (b.data as any).date > now;

        if (aIsUpcomingEvent && !bIsUpcomingEvent) return -1;
        if (!aIsUpcomingEvent && bIsUpcomingEvent) return 1;

        return b.date.getTime() - a.date.getTime();
      });

      return {
        items: allItems,
        nextCursor,
      };
    }),

  /**
   * Get a single photo by ID
   */
  getById: publicProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;

      const photo = await ctx.db.photo.findUnique({
        where: { id },
        include: {
          user: {
            include: {
              academicGroup: true,
            },
          },
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
            include: {
              user: true,
            },
            orderBy: { createdAt: "desc" },
          },
          event: true,
        },
      });

      if (!photo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Фотография не найдена",
        });
      }

      return photo;
    }),

  /**
   * Get presigned URL for uploading
   */
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        contentType: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { filename, contentType } = input;

      const key = `uploads/${generateUniqueFilename(filename)}`;

      const presignedUrl = await getPresignedUploadUrl(key, contentType);

      return {
        presignedUrl,
        key,
        url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      };
    }),

  /**
   * Save uploaded photo information to database
   */
  createPhoto: protectedProcedure
    .input(
      z.object({
        url: z.string(),
        description: z.string().optional(),
        eventId: z.number().optional(),
        tags: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { url, description, eventId, tags } = input;

      if (!ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Вы должны быть авторизованы для загрузки фотографий",
        });
      }

      const photo = await ctx.db.photo.create({
        data: {
          url,
          description,
          userId: ctx.session.user.id,
          ...(eventId ? { eventId } : {}),
        },
      });

      if (tags.length > 0) {
        for (const tagName of tags) {
          let tag = await ctx.db.tag.findFirst({
            where: { name: tagName },
          });

          if (!tag) {
            tag = await ctx.db.tag.create({
              data: { name: tagName },
            });
          }

          await ctx.db.photoTag.create({
            data: {
              photoId: photo.id,
              tagId: tag.id,
            },
          });
        }
      }

      return photo;
    }),

  /**
   * Like a photo
   */
  likePhoto: protectedProcedure
    .input(
      z.object({
        photoId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { photoId } = input;

      const photoExists = await ctx.db.photo.findUnique({
        where: { id: photoId },
      });

      if (!photoExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Фотография не найдена",
        });
      }

      const existingLike = await ctx.db.like.findUnique({
        where: {
          userId_photoId: {
            userId: ctx.session.user.id,
            photoId,
          },
        },
      });

      if (existingLike) {
        await ctx.db.like.delete({
          where: {
            userId_photoId: {
              userId: ctx.session.user.id,
              photoId,
            },
          },
        });
        return { liked: false };
      }

      await ctx.db.like.create({
        data: {
          userId: ctx.session.user.id,
          photoId,
        },
      });

      return { liked: true };
    }),

  /**
   * Add a comment to a photo
   */
  addComment: protectedProcedure
    .input(
      z.object({
        photoId: z.number(),
        text: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { photoId, text } = input;

      const photoExists = await ctx.db.photo.findUnique({
        where: { id: photoId },
      });

      if (!photoExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Фотография не найдена",
        });
      }

      const comment = await ctx.db.comment.create({
        data: {
          photoId,
          userId: ctx.session.user.id,
          text,
        },
        include: {
          user: true,
        },
      });

      return comment;
    }),

  /**
   * Delete a comment
   */
  deleteComment: protectedProcedure
    .input(
      z.object({
        commentId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { commentId } = input;

      const comment = await ctx.db.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Комментарий не найден",
        });
      }

      if (
        comment.userId !== ctx.session.user.id &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "У вас нет прав на удаление этого комментария",
        });
      }

      await ctx.db.comment.delete({
        where: { id: commentId },
      });

      return { success: true };
    }),

  /**
   * Get comments for a photo
   */
  getComments: publicProcedure
    .input(
      z.object({
        photoId: z.number(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { photoId, limit, cursor } = input;

      const comments = await ctx.db.comment.findMany({
        where: { photoId },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;

      if (comments.length > limit) {
        const nextItem = comments.pop();
        nextCursor = nextItem!.id;
      }

      return {
        comments,
        nextCursor,
      };
    }),

  /**
   * Delete a photo
   */
  deletePhoto: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const photo = await ctx.db.photo.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!photo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Фотография не найдена",
        });
      }

      if (
        photo.userId !== ctx.session.user.id &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "У вас нет прав на удаление этой фотографии",
        });
      }

      await ctx.db.comment.deleteMany({ where: { photoId: id } });
      await ctx.db.like.deleteMany({ where: { photoId: id } });
      await ctx.db.photoTag.deleteMany({ where: { photoId: id } });
      await ctx.db.albumPhoto.deleteMany({ where: { photoId: id } });

      await ctx.db.photo.delete({ where: { id } });

      return { success: true };
    }),

  /**
   * Get dates that have photos
   */
  getDatesWithPhotos: publicProcedure.query(async ({ ctx }) => {
    try {
      const mockDates = [
        new Date(),
        new Date(Date.now() - 86400000),
        new Date(Date.now() - 86400000 * 2),
        new Date(Date.now() - 86400000 * 5),
        new Date(Date.now() - 86400000 * 10),
      ];

      return {
        dates: mockDates,
      };
    } catch (error) {
      console.error("Failed to get dates with photos:", error);
      return { dates: [] };
    }
  }),

  getUserLikes: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const userId = ctx.session.user.id;

      const likes = await ctx.db.like.findMany({
        where: { userId },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          photo: {
            include: {
              user: true,
              event: true,
              tags: {
                include: {
                  tag: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: number | undefined = undefined;

      if (likes.length > limit) {
        const nextItem = likes.pop();
        nextCursor = nextItem!.id;
      }

      const items = likes.map((like) => ({
        id: `photo-${like.photoId}`,
        type: "photo" as const,
        data: {
          ...like.photo,
          likes: like.photo._count.likes,
          comments: like.photo._count.comments,
          liked: true,
        },
      }));

      return {
        items,
        nextCursor,
      };
    }),

  getTrending: publicProcedure.query(async ({ ctx }) => {
    const photos = await ctx.db.photo.findMany({
      where: {
        uploadDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: [
        {
          likes: {
            _count: "desc",
          },
        },
        {
          uploadDate: "desc",
        },
      ],
      take: 30,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            academicGroup: {
              select: {
                name: true,
              },
            },
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
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return { photos };
  }),

  getByTag: publicProcedure
    .input(
      z.object({
        tagName: z.string(),
        limit: z.number().optional().default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!input.tagName) {
        return { photos: [] };
      }

      const photos = await ctx.db.photo.findMany({
        where: {
          tags: {
            some: {
              tag: {
                name: input.tagName,
              },
            },
          },
        },
        orderBy: {
          uploadDate: "desc",
        },
        take: input.limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              academicGroup: {
                select: {
                  name: true,
                },
              },
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
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return { photos };
    }),
});
