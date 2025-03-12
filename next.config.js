/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: [
      "picsum.photos",
      "source.unsplash.com",
      "i.pravatar.cc",
      "mirea.ru",
      "www.mirea.ru",
      "via.placeholder.com",
      "campus-snaps.storage.yandexcloud.net",
    ],

    minimumCacheTTL: 3600,

    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],

    formats: ["image/webp"],
  },
};

export default config;
