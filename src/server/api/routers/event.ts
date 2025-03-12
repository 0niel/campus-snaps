import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const eventRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().optional(),
        withPhotos: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const mockEvents = [
          {
            id: 1,
            title: "День открытых дверей",
            description: "Приглашаем абитуриентов и их родителей!",
            date: new Date(Date.now() + 86400000 * 3),
            location: "Главный корпус",
            photos: [],
          },
          {
            id: 2,
            title: "Студенческая конференция",
            description: "Презентации научных работ студентов",
            date: new Date(Date.now() + 86400000 * 7),
            location: "Аудитория А-12",
            photos: [],
          },
        ];

        return {
          events: mockEvents,
          nextCursor: undefined,
        };
      } catch (error) {
        console.error("Failed to get events:", error);
        return {
          events: [],
          nextCursor: undefined,
        };
      }
    }),

  /**
   * Get a single event by ID
   */
  getById: publicProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;

      const event = await ctx.db.event.findUnique({
        where: { id },
        include: {
          photos: {
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
            orderBy: { uploadDate: "desc" },
          },
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Мероприятие не найдено",
        });
      }

      return event;
    }),

  /**
   * Create a new event
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(1000).optional(),
        date: z.date(),
        coverImage: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, description, date, coverImage } = input;

      if (
        ctx.session.user.role !== "ADMIN" &&
        ctx.session.user.role !== "TEACHER" &&
        ctx.session.user.role !== "ORGANIZER"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "У вас нет прав на создание мероприятий",
        });
      }

      const event = await ctx.db.event.create({
        data: {
          name,
          description,
          date,
          coverImage,
        },
      });

      return event;
    }),

  /**
   * Update an existing event
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(1000).optional(),
        date: z.date().optional(),
        coverImage: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, description, date, coverImage } = input;

      const event = await ctx.db.event.findUnique({
        where: { id },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Мероприятие не найдено",
        });
      }

      if (
        ctx.session.user.role !== "ADMIN" &&
        ctx.session.user.role !== "TEACHER" &&
        ctx.session.user.role !== "ORGANIZER"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "У вас нет прав на редактирование мероприятий",
        });
      }

      const updatedEvent = await ctx.db.event.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(date && { date }),
          ...(coverImage && { coverImage }),
        },
      });

      return updatedEvent;
    }),

  /**
   * Delete an event
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const event = await ctx.db.event.findUnique({
        where: { id },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Мероприятие не найдено",
        });
      }

      if (
        ctx.session.user.role !== "ADMIN" &&
        ctx.session.user.role !== "TEACHER"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "У вас нет прав на удаление мероприятий",
        });
      }

      await ctx.db.photo.updateMany({
        where: { eventId: id },
        data: { eventId: null },
      });

      await ctx.db.albumEvent.deleteMany({
        where: { eventId: id },
      });

      await ctx.db.event.delete({
        where: { id },
      });

      return { success: true };
    }),

  /**
   * Associate photos with event
   */
  addPhotos: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        photoIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { eventId, photoIds } = input;

      const event = await ctx.db.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Мероприятие не найдено",
        });
      }

      if (
        ctx.session.user.role !== "ADMIN" &&
        ctx.session.user.role !== "TEACHER" &&
        ctx.session.user.role !== "ORGANIZER"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "У вас нет прав на добавление фотографий к мероприятию",
        });
      }

      for (const photoId of photoIds) {
        await ctx.db.photo.update({
          where: { id: photoId },
          data: { eventId },
        });
      }

      return { success: true };
    }),

  /**
   * Get upcoming events
   */
  getUpcoming: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(10).default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit } = input;
      const now = new Date();

      const events = await ctx.db.event.findMany({
        take: limit,
        where: {
          date: { gte: now },
        },
        orderBy: { date: "asc" },
        include: {
          photos: {
            take: 1,
          },
          _count: {
            select: {
              photos: true,
            },
          },
        },
      });

      return events;
    }),

  /**
   * Remove photos from event
   */
  removePhotos: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        photoIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { eventId, photoIds } = input;

      const event = await ctx.db.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Мероприятие не найдено",
        });
      }

      if (
        ctx.session.user.role !== "ADMIN" &&
        ctx.session.user.role !== "TEACHER" &&
        ctx.session.user.role !== "ORGANIZER"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "У вас нет прав на удаление фотографий из мероприятия",
        });
      }

      await ctx.db.photo.updateMany({
        where: {
          id: { in: photoIds },
          eventId,
        },
        data: {
          eventId: null,
        },
      });

      return { success: true };
    }),

  /**
   * Add event to album
   */
  addToAlbum: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        albumId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { eventId, albumId } = input;

      const [event, album] = await Promise.all([
        ctx.db.event.findUnique({ where: { id: eventId } }),
        ctx.db.album.findUnique({ where: { id: albumId } }),
      ]);

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Мероприятие не найдено",
        });
      }

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

      const existing = await ctx.db.albumEvent.findUnique({
        where: {
          albumId_eventId: {
            albumId,
            eventId,
          },
        },
      });

      if (existing) {
        return { success: true, message: "Мероприятие уже добавлено в альбом" };
      }

      await ctx.db.albumEvent.create({
        data: {
          albumId,
          eventId,
        },
      });

      return { success: true };
    }),
});
