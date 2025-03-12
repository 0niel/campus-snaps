import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { type Photo } from "~/types";
import { ImageWithCache } from "./ImageWithCache";

type SwipeableGalleryProps = {
  photos: Photo[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onClose?: () => void;
};

export function SwipeableGallery({
  photos,
  initialIndex = 0,
  onIndexChange,
  onClose,
}: SwipeableGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const dragStartRef = useRef(0);
  const swipeThreshold = 100;

  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(currentIndex);
    }
  }, [currentIndex, onIndexChange]);

  const handleDragStart = useCallback(
    (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      dragStartRef.current = info.point.x;
      setIsDragging(true);
    },
    [],
  );

  const handleDragEnd = useCallback(
    (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      const dragDistance = info.point.x - dragStartRef.current;
      const velocity = info.velocity.x;

      if (dragDistance > swipeThreshold || velocity > 0.5) {
        if (currentIndex > 0) {
          setDirection("right");
          setCurrentIndex((prev) => prev - 1);
          setIsLoading(true);
        }
      } else if (dragDistance < -swipeThreshold || velocity < -0.5) {
        if (currentIndex < photos.length - 1) {
          setDirection("left");
          setCurrentIndex((prev) => prev + 1);
          setIsLoading(true);
        }
      }
    },
    [currentIndex, photos.length],
  );

  const handleDrag = useCallback(
    (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const dragDistance = info.point.x - dragStartRef.current;

      if (dragDistance > 10) {
        setDirection("right");
      } else if (dragDistance < -10) {
        setDirection("left");
      }
    },
    [],
  );

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleDismiss = useCallback(
    (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const dragDistanceY = info.offset.y;
      const velocityY = info.velocity.y;

      if (Math.abs(dragDistanceY) > 100 || Math.abs(velocityY) > 0.5) {
        if (onClose) {
          onClose();
        }
      }
    },
    [onClose],
  );

  const currentPhoto = photos[currentIndex];

  return (
    <div className="h-full w-full">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={`photo-${currentIndex}`}
          initial={{ opacity: 0, x: direction === "left" ? 300 : -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction === "left" ? -300 : 300 }}
          transition={{ duration: 0.3 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          className="h-full w-full overflow-hidden"
        >
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.5}
            onDragEnd={handleDismiss}
            className="h-full w-full"
          >
            {currentPhoto && (
              <div className="flex h-full w-full items-center justify-center">
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>
                  </div>
                )}
                <ImageWithCache
                  src={currentPhoto.url}
                  alt={currentPhoto.description || "Фото"}
                  width={1200}
                  height={1200}
                  className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${
                    isLoading ? "opacity-0" : "opacity-100"
                  }`}
                  onLoadingComplete={handleImageLoad}
                  priority={true}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Pagination dots for mobile */}
      {photos.length > 1 && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center">
          <div className="flex space-x-1 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
            {photos.map((_, index) => (
              <div
                key={`dot-${index}`}
                className={`h-2 w-2 rounded-full ${
                  index === currentIndex ? "bg-white" : "bg-gray-500"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
