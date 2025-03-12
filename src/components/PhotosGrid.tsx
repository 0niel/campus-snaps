import React, { useState } from "react";
import { motion } from "framer-motion";
import { type Photo } from "~/types";
import { ImageWithCache } from "./ImageWithCache";
import { PhotoModal } from "./PhotoModal";

type PhotosGridProps = {
  photos: Photo[];
  columns?: number;
  gap?: number;
  aspectRatio?: string;
  className?: string;
  onTagClick?: (tag: string) => void;
};

export function PhotosGrid({
  photos,
  columns = 3,
  gap = 4,
  aspectRatio = "4/3",
  className = "",
  onTagClick,
}: PhotosGridProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null,
  );

  const createFeedItem = () => {
    return {
      id: "photos-grid",
      type: "userPhotos",
      data: { photos },
      timestamp: new Date().toISOString(),
    };
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleCloseModal = () => {
    setSelectedPhotoIndex(null);
  };

  const getColumnClass = () => {
    switch (columns) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
      case 5:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
      default:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
    }
  };

  const getGapClass = () => {
    switch (gap) {
      case 1:
        return "gap-1";
      case 2:
        return "gap-2";
      case 3:
        return "gap-3";
      case 4:
        return "gap-4";
      case 5:
        return "gap-5";
      case 6:
        return "gap-6";
      case 8:
        return "gap-8";
      default:
        return "gap-4";
    }
  };

  return (
    <>
      <div className={`grid ${getColumnClass()} ${getGapClass()} ${className}`}>
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              type: "spring",
              stiffness: 300,
              damping: 24,
            }}
            className="group relative overflow-hidden rounded-lg"
            style={{ aspectRatio }}
            onClick={() => handlePhotoClick(index)}
          >
            <ImageWithCache
              src={photo.url}
              alt={photo.description || "Фото"}
              width={400}
              height={300}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Photo info on hover */}
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {photo.description && (
                <p className="line-clamp-2 text-sm font-medium">
                  {photo.description}
                </p>
              )}

              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center">
                  {photo.user?.image && (
                    <ImageWithCache
                      src={photo.user.image}
                      alt={photo.user.name || ""}
                      width={24}
                      height={24}
                      className="mr-1 h-5 w-5 rounded-full"
                    />
                  )}
                  <span className="text-xs">
                    {photo.user?.name || "Пользователь"}
                  </span>
                </div>

                {photo.likes?.length > 0 && (
                  <div className="flex items-center">
                    <svg
                      className="mr-1 h-3 w-3 fill-red-500"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="text-xs">{photo.likes.length}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedPhotoIndex !== null && (
        <PhotoModal
          item={createFeedItem()}
          initialPhotoIndex={selectedPhotoIndex}
          onClose={handleCloseModal}
          onTagClick={onTagClick}
        />
      )}
    </>
  );
}
