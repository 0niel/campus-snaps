import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { type User, type Photo, type FeedItem } from "~/types";

type OrganizationCardProps = {
  user: User;
  photos: Photo[];
  onOpen: (item: FeedItem) => void;
  title?: string;
};

export function OrganizationCard({
  user,
  photos,
  onOpen,
  title,
}: OrganizationCardProps) {
  const orgName = user.academicGroup?.name || "Организация";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="mb-6 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-900 to-purple-900 shadow-lg"
    >
      {/* Header with org info */}
      <div className="relative p-4">
        <div className="flex items-center">
          {user.image && (
            <div className="mr-4 h-12 w-12 overflow-hidden rounded-full border-2 border-purple-300 bg-white">
              <Image
                src={user.image}
                alt={user.name || ""}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{orgName}</h3>
            <p className="text-sm text-purple-200">
              {title || `Публикация от ${user.name}`}
            </p>
          </div>
          <div className="rounded-full bg-purple-500/30 px-3 py-1 text-xs font-medium text-white">
            Организация
          </div>
        </div>
      </div>

      {/* Photo grid with modern layout */}
      <div className="grid grid-cols-6 grid-rows-2 gap-0.5 overflow-hidden">
        {photos.slice(0, 5).map((photo, idx) => (
          <div
            key={`org-photo-${photo.id}`}
            className={`relative cursor-pointer overflow-hidden ${
              idx === 0
                ? "col-span-6 row-span-1"
                : idx < 3
                  ? "col-span-3 row-span-1"
                  : "col-span-3 row-span-1"
            }`}
            onClick={() =>
              onOpen({
                id: photo.id,
                type: "photo",
                data: photo,
                date: photo.uploadDate,
              })
            }
          >
            <Image
              src={photo.url}
              alt={photo.description || `Фото ${idx + 1}`}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
            />

            {/* Show count of remaining photos on the last visible photo */}
            {idx === 4 && photos.length > 5 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-center text-white">
                <span className="font-medium">+{photos.length - 5} ещё</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer with actions */}
      <div className="bg-gradient-to-r from-indigo-800 to-purple-800 p-3 text-white">
        <div className="flex items-center justify-between">
          <button
            onClick={() =>
              onOpen({
                id: 3000 + Math.floor(Math.random() * 1000),
                type: "userPhotos",
                data: { user, photos },
                date: photos[0].uploadDate,
              })
            }
            className="flex items-center text-sm font-medium text-purple-200 transition hover:text-white"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Посмотреть все фото
          </button>
          <span className="text-xs text-purple-200">
            {new Date(photos[0].uploadDate).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
