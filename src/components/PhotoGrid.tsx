import React, { useState } from "react";
import { motion } from "framer-motion";
import type { FeedItem } from "~/types";
import { ImageWithCache } from "~/components/ImageWithCache";

interface PhotoGridProps {
  items: FeedItem[];
  onPhotoClick: (item: FeedItem) => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  items,
  onPhotoClick,
}) => {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const getGridColumns = () => {
    if (items.length === 1) return "grid-cols-1";
    if (items.length === 2) return "grid-cols-2";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  };

  const handleImageLoad = (id: number | string) => {
    setLoadedImages((prev) => ({
      ...prev,
      [id.toString()]: true,
    }));
  };

  return (
    <div className={`grid gap-4 ${getGridColumns()}`}>
      {items.map((item) => {
        const imageUrl =
          item.type === "photo"
            ? item.data.url
            : item.data.photos?.[0]?.url || "/placeholder.jpg";
        const isLoaded = loadedImages[item.id.toString()];

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0.5, y: isLoaded ? 0 : 20 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="overflow-hidden rounded-lg bg-gray-900 shadow-lg"
            onClick={() => onPhotoClick(item)}
          >
            <div className="relative aspect-square">
              <ImageWithCache
                src={imageUrl}
                alt={item.data.description || "Photo"}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                onLoadingComplete={() => handleImageLoad(item.id)}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
