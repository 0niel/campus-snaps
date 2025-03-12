import React, { useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import type { Photo } from "~/types";
import { ImageWithCache } from "~/components/ImageWithCache";

interface PhotoCardProps {
  photo: Photo;
  onOpen: () => void;
  onTagClick?: (tag: string) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onOpen,
  onTagClick,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 break-inside-avoid"
    >
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden rounded-xl bg-gray-900 shadow-lg"
      >
        {/* Photo */}
        <div className="cursor-pointer" onClick={onOpen}>
          <div className="relative aspect-auto overflow-hidden bg-gray-800">
            {/* Use fixed height for consistent layout */}
            <div style={{ height: "240px", position: "relative" }}>
              <ImageWithCache
                src={photo.url}
                alt={photo.description || "Фотография кампуса"}
                fill
                className={`object-cover transition-transform duration-500 hover:scale-105 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                onLoadingComplete={() => setImageLoaded(true)}
                priority={false}
              />
            </div>

            {/* User info overlay at top */}
            <div className="absolute left-0 top-0 w-full p-3">
              <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
                {photo.user.image && (
                  <ImageWithCache
                    src={photo.user.image}
                    alt={photo.user.name || ""}
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full border border-white/30"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white">
                    {photo.user.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Tags overlay at bottom */}
            {photo.tags.length > 0 && (
              <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                {photo.tags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="cursor-pointer rounded-full bg-black/40 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTagClick?.(tag.name);
                    }}
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info section - minimized for photo focus */}
        <div className="p-3">
          {photo.description && (
            <p className="mb-2 line-clamp-2 text-sm text-gray-300">
              {photo.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center text-sm text-gray-400">
                <svg
                  className="mr-1 h-4 w-4 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {photo.likes.length}
              </span>
              <span className="flex items-center text-sm text-gray-400">
                <svg
                  className="mr-1 h-4 w-4 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {photo.comments.length}
              </span>
            </div>

            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(photo.uploadDate), {
                addSuffix: true,
                locale: ru,
              })}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
