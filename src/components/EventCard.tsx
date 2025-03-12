import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import type { Event } from "~/types";

interface EventCardProps {
  event: Event;
  onOpen: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onOpen }) => {
  const isUpcoming = new Date(event.date) > new Date();
  const formattedDate = new Date(event.date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeDistance = formatDistanceToNow(new Date(event.date), {
    addSuffix: true,
    locale: ru,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 break-inside-avoid"
    >
      <motion.div
        whileHover={{ y: -4 }}
        className="overflow-hidden rounded-xl bg-gray-900 shadow-lg"
      >
        <div className="relative cursor-pointer" onClick={onOpen}>
          <div className="aspect-video overflow-hidden bg-gray-800">
            {event.coverImage ? (
              <Image
                src={event.coverImage}
                alt={event.name}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              event.photos &&
              event.photos[0] && (
                <Image
                  src={event.photos[0].url}
                  alt={event.name}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              )
            )}
          </div>

          {/* Status badge */}
          <div className="absolute right-2 top-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                isUpcoming
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {isUpcoming ? "Предстоящее" : "Прошедшее"}
            </span>
          </div>

          {/* Bottom gradient and title */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
            <h3 className="text-lg font-bold text-white">{event.name}</h3>
            <p className="text-sm text-white/80">{formattedDate}</p>
          </div>
        </div>

        <div className="p-3">
          {event.description && (
            <p className="mb-3 line-clamp-2 text-sm text-gray-300">
              {event.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-400">{timeDistance}</span>
            </div>

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
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                </svg>
                {event.photos?.length || 0} фото
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
