import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { FeedItem } from "~/types";
import { api } from "~/trpc/react";

interface FeaturedEventsProps {
  onItemClick: (item: FeedItem) => void;
}

export const FeaturedEvents: React.FC<FeaturedEventsProps> = ({
  onItemClick,
}) => {
  const { data: events, isLoading } = api.event.getUpcoming.useQuery({
    limit: 3,
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold">Предстоящие мероприятия</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`skeleton-event-${index}`}
              className="h-64 animate-pulse rounded-xl bg-gray-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!events?.length) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl font-bold">Предстоящие мероприятия</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <motion.div
            key={`featured-event-${event.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-xl bg-white text-black shadow-md"
          >
            <div className="relative h-40">
              <Image
                src={
                  event.coverImage ||
                  (event.photos && event.photos.length > 0
                    ? event.photos[0].url
                    : "https://picsum.photos/800/400")
                }
                alt={event.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{event.name}</h3>
                  <p className="text-sm text-white/90">
                    {new Date(event.date).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
              </div>
              <div className="absolute right-2 top-2 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white">
                Скоро
              </div>
            </div>
            <div className="p-4">
              {event.description && (
                <p className="mb-3 text-sm text-gray-600">
                  {event.description}
                </p>
              )}
              <button
                onClick={() =>
                  onItemClick({
                    id: event.id + 2000,
                    type: "event",
                    title: event.name,
                    data: event,
                    date: new Date(event.date),
                  })
                }
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {event._count?.photos || 0} фото →
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
