import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { User, Photo } from "~/types";

interface UserPhotosCardProps {
  data: { user: User; photos: Photo[] };
  onPhotoClick: (index: number) => void;
}

export const UserPhotosCard: React.FC<UserPhotosCardProps> = ({
  data,
  onPhotoClick,
}) => {
  const { user, photos } = data;
  const isOrg =
    user.academicGroup &&
    ["Студенческий Медиацентр", "Студенческий союз"].includes(
      user.academicGroup.name,
    );

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
          isOrg ? "border-l-4 border-purple-500" : ""
        }`}
      >
        <div className="border-b border-gray-800 p-3">
          <div className="flex items-center">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name ?? ""}
                width={36}
                height={36}
                className="mr-3 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://via.placeholder.com/36?text=У";
                }}
              />
            )}
            <div>
              <h3 className="font-medium text-white">{user.name}</h3>
              {user.academicGroup && (
                <div className="flex items-center">
                  <p className="text-xs text-gray-400">
                    {user.academicGroup.name}
                  </p>
                  {isOrg && (
                    <span className="ml-2 rounded-full bg-purple-900/80 px-2 py-0.5 text-xs text-purple-200">
                      Организация
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0.5 p-0.5">
          {photos.slice(0, 4).map((photo, index) => (
            <div
              key={`user-photo-${photo.id}`}
              className={`relative cursor-pointer ${index === 0 ? "col-span-2" : ""}`}
              onClick={() => onPhotoClick(index)}
            >
              <div
                className={`${index === 0 ? "aspect-[16/9]" : "aspect-square"} overflow-hidden bg-gray-800`}
              >
                <Image
                  src={photo.url}
                  alt={photo.description ?? "Фото пользователя"}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNcvmhRPQAGTwJs6OQmwAAAAABJRU5ErkJggg=="
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-gray-800 p-3 text-xs text-gray-400">
          <button className="flex items-center font-medium text-blue-400 transition-colors hover:text-blue-300">
            <svg
              className="mr-1 h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
            Все фото
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
