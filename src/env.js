import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables schema
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.preprocess(
      (str) => process.env.VERCEL_URL ?? str,

      process.env.VERCEL ? z.string() : z.string().url(),
    ),

    EMAIL_SERVER_HOST: z.string().min(1),
    EMAIL_SERVER_PORT: z.coerce.number().int(),
    EMAIL_SERVER_USER: z.string().min(1),
    EMAIL_SERVER_PASSWORD: z.string().min(1),
    EMAIL_FROM: z.string().email(),

    STORAGE_PROVIDER: z.enum(["aws", "local", "yandex"]).default("local"),

    STORAGE_AWS_ACCESS_KEY: z.string().optional(),
    STORAGE_AWS_SECRET_KEY: z.string().optional(),
    STORAGE_AWS_REGION: z.string().optional(),
    STORAGE_AWS_BUCKET_NAME: z.string().optional(),

    STORAGE_YANDEX_ACCESS_KEY: z.string().optional(),
    STORAGE_YANDEX_SECRET_KEY: z.string().optional(),
    STORAGE_YANDEX_REGION: z.string().optional(),
    STORAGE_YANDEX_BUCKET_NAME: z.string().optional(),
    STORAGE_YANDEX_ENDPOINT: z.string().optional(),
    STORAGE_YANDEX_FORCE_PATH_STYLE: z.string().optional(),
    STORAGE_YANDEX_URL_FORMAT: z.string().optional(),

    STORAGE_LOCAL_PATH: z.string().optional().default("./public/uploads"),
  },
  /**
   * Client-side environment variables schema
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtime (e.g.
   * middleware) or client-side, so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
    EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
    EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
    EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,

    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
    STORAGE_AWS_ACCESS_KEY: process.env.STORAGE_AWS_ACCESS_KEY,
    STORAGE_AWS_SECRET_KEY: process.env.STORAGE_AWS_SECRET_KEY,
    STORAGE_AWS_REGION: process.env.STORAGE_AWS_REGION,
    STORAGE_AWS_BUCKET_NAME: process.env.STORAGE_AWS_BUCKET_NAME,
    STORAGE_LOCAL_PATH: process.env.STORAGE_LOCAL_PATH,

    STORAGE_YANDEX_ACCESS_KEY: process.env.STORAGE_YANDEX_ACCESS_KEY,
    STORAGE_YANDEX_SECRET_KEY: process.env.STORAGE_YANDEX_SECRET_KEY,
    STORAGE_YANDEX_REGION: process.env.STORAGE_YANDEX_REGION,
    STORAGE_YANDEX_BUCKET_NAME: process.env.STORAGE_YANDEX_BUCKET_NAME,
    STORAGE_YANDEX_ENDPOINT: process.env.STORAGE_YANDEX_ENDPOINT,
    STORAGE_YANDEX_FORCE_PATH_STYLE:
      process.env.STORAGE_YANDEX_FORCE_PATH_STYLE,
    STORAGE_YANDEX_URL_FORMAT: process.env.STORAGE_YANDEX_URL_FORMAT,

    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  /**
   * For Next.js >= 13.4.4, you only need to destructure client variables:
   * https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
