import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  PencilSquareIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import type { User } from "~/types";

interface ProfileHeaderProps {
  user?: User;
  stats?: {
    photosCount: number;
    eventsCount: number;
    likesCount: number;
  };
  onEditClick: () => void;
  onLogoutClick: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  stats,
  onEditClick,
  onLogoutClick,
}) => {
  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 rounded-xl bg-gray-900 p-6 shadow-lg"
    >
      <div className="flex flex-col items-center sm:flex-row sm:items-start">
        <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full bg-gray-800 sm:mb-0 sm:h-32 sm:w-32">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || "Профиль"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-400">
              {user.name?.charAt(0) || "У"}
            </div>
          )}
        </div>

        <div className="flex-1 text-center sm:ml-6 sm:text-left">
          <h1 className="text-2xl font-bold text-white">{user.name}</h1>

          <div className="mt-2 text-gray-400">
            {user.academicGroup ? (
              <p>{user.academicGroup.name}</p>
            ) : (
              <p>Группа не указана</p>
            )}
          </div>

          {user.bio && <p className="mt-3 text-gray-300">{user.bio}</p>}

          <div className="mt-4 flex flex-wrap justify-center gap-4 sm:justify-start">
            <div className="text-center">
              <span className="block text-xl font-bold text-white">
                {stats?.photosCount || 0}
              </span>
              <span className="text-sm text-gray-400">Фото</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-bold text-white">
                {stats?.eventsCount || 0}
              </span>
              <span className="text-sm text-gray-400">Мероприятия</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-bold text-white">
                {stats?.likesCount || 0}
              </span>
              <span className="text-sm text-gray-400">Лайки</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:mt-0">
          <button
            onClick={onEditClick}
            className="inline-flex items-center rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PencilSquareIcon className="mr-2 h-4 w-4" />
            Редактировать
          </button>

          <button
            onClick={onLogoutClick}
            className="inline-flex items-center rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
            Выйти
          </button>
        </div>
      </div>
    </motion.div>
  );
};
