import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import type { Album } from "~/types";

interface AlbumCardProps {
  album: Album;
  onOpen: () => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, onOpen }) => {
  const hasPhotos = album.photos && album.photos.length > 0;
  const isGroup = !!album.academicGroupId;
  const timeDistance = album.createdAt
    ? formatDistanceToNow(new Date(album.createdAt), {
        addSuffix: true,
        locale: ru,
      })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 break-inside-avoid"
    >
      <motion.div
        whileHover={{ y: -4 }}
        className={`overflow-hidden rounded-xl bg-gray-900 shadow-lg ${
          isGroup ? "border-l-4 border-blue-500" : ""
        }`}
      >
        {/* Album cover */}
        <div className="cursor-pointer" onClick={onOpen}>
          <div className="relative aspect-[3/2] overflow-hidden bg-gray-800">
            {album.coverImage ? (
              <Image
                src={album.coverImage}
                alt={album.title || "Альбом"}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : hasPhotos ? (
              <Image
                src={album.photos[0].photo.url}
                alt={album.title || "Альбом"}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <svg
                  className="h-16 w-16 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
              <h3 className="text-lg font-bold text-white">{album.title}</h3>
              {album.academicGroup && (
                <p className="text-sm text-white/80">
                  {album.academicGroup.name}
                </p>
              )}
            </div>
          </div>

          {/* Preview photos grid */}
          {hasPhotos && album.photos.length > 1 && (
            <div className="grid grid-cols-4 gap-0.5 p-0.5">
              {album.photos.slice(1, 5).map((item, index) => (
                <div
                  key={`album-preview-${item.photo.id}`}
                  className="aspect-square overflow-hidden bg-gray-800"
                >
                  <Image
                    src={item.photo.url}
                    alt={item.photo.description || "Фото из альбома"}
                    width={100}
                    height={100}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Album info */}
        <div className="p-3">
          {album.description && (
            <p className="mb-3 line-clamp-2 text-sm text-gray-300">
              {album.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {album.owner?.image && (
                <Image
                  src={album.owner.image}
                  alt={album.owner.name || ""}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <span className="text-xs text-gray-400">
                {album.owner?.name || "Пользователь"}
              </span>
            </div>

            <div className="flex gap-3">
              <span className="flex items-center text-xs text-gray-400">
                <svg
                  className="mr-1 h-3 w-3 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                </svg>
                {album._count?.photos || album.photos?.length || 0}
              </span>
              {timeDistance && (
                <span className="text-xs text-gray-500">{timeDistance}</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
