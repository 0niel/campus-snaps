import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { randomUUID } from "crypto";
import { StorageProviderFactory } from "~/server/storage/provider-factory";

export const uploadRouter = createTRPCRouter({
  uploadFile: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        contentType: z.string(),
        base64Data: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { filename, contentType, base64Data } = input;

      const fileExtension = filename.split(".").pop()?.toLowerCase() ?? "";

      const allowedTypes = ["jpg", "jpeg", "png", "webp"];
      if (!allowedTypes.includes(fileExtension)) {
        throw new Error(
          "Недопустимый тип файла. Разрешены только JPG, PNG и WebP.",
        );
      }

      try {
        const buffer = Buffer.from(base64Data, "base64");

        const fileSizeMB = buffer.length / (1024 * 1024);
        if (fileSizeMB > 10) {
          throw new Error("Файл слишком большой. Максимальный размер 10MB.");
        }

        const uniqueFilename = `${randomUUID()}-${filename}`;

        const userId = ctx.session.user.id;
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");

        const fileKey = `uploads/${userId}/${year}/${month}/${uniqueFilename}`;

        const storageProvider = StorageProviderFactory.getProvider();

        const result = await storageProvider.uploadFile({
          buffer,
          key: fileKey,
          contentType,
          makePublic: true,
        });

        return {
          success: true,
          url: result.url,
          key: result.key,
        };
      } catch (error) {
        console.error("Error uploading file:", error);
        throw new Error(`Ошибка загрузки: ${(error as Error).message}`);
      }
    }),
});
