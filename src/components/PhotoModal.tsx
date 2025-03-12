import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { type FeedItem, type Photo, type Album, type Event } from "~/types";
import { ImageWithCache } from "~/components/ImageWithCache";
import { CommentForm } from "~/components/CommentForm";
import { CommentList } from "~/components/CommentList";
import { LikeButton } from "~/components/LikeButton";

type PhotoModalProps = {
  item: FeedItem;
  initialPhotoIndex?: number;
  onClose: () => void;
  onTagClick?: (tag: string) => void;
};

export function PhotoModal({
  item,
  initialPhotoIndex = 0,
  onClose,
  onTagClick,
}: PhotoModalProps) {
  const getPhotos = () => {
    if (item.type === "photo") {
      return [item.data as Photo];
    } else if (item.type === "album") {
      return (item.data as Album).photos.map((p) => p.photo);
    } else if (item.type === "event") {
      return (item.data as Event).photos;
    } else if (item.type === "userPhotos" || item.type === "groupPhotos") {
      return (item.data as any).photos as Photo[];
    }
    return [];
  };

  const photos = getPhotos();
  const [currentIndex, setCurrentIndex] = useState(initialPhotoIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "info">("comments");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const currentPhoto = photos[currentIndex];
  const hasMultiplePhotos = photos.length > 1;

  useEffect(() => {
    if (currentPhoto) {
      setLikeCount(currentPhoto.likes?.length || 0);

      setLiked(false);
      setIsLoading(true);
    }
  }, [currentPhoto]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && currentIndex > 0 && !isAnimating) {
        setIsAnimating(true);
        setCurrentIndex((prev) => prev - 1);
        setIsLoading(true);
      } else if (
        e.key === "ArrowRight" &&
        currentIndex < photos.length - 1 &&
        !isAnimating
      ) {
        setIsAnimating(true);
        setCurrentIndex((prev) => prev + 1);
        setIsLoading(true);
      } else if (e.key === "i") {
        setActiveTab("info");
      } else if (e.key === "c") {
        setActiveTab("comments");
        setTimeout(() => {
          commentInputRef.current?.focus();
        }, 100);
      } else if (e.key === "l") {
        handleLikeToggle();
      } else if (e.key === "f") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, photos.length, onClose, isAnimating]);

  const goToNext = useCallback(() => {
    if (currentIndex < photos.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex((prev) => prev + 1);
      setIsLoading(true);
    }
  }, [currentIndex, photos.length, isAnimating]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex((prev) => prev - 1);
      setIsLoading(true);
    }
  }, [currentIndex, isAnimating]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setIsAnimating(false);
  };

  const handleLikeToggle = () => {
    if (liked) {
      setLikeCount((prev) => Math.max(prev - 1, 0));
    } else {
      setLikeCount((prev) => prev + 1);
    }
    setLiked((prev) => !prev);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullscreen(false);
      }
    }
  };

  const handleDownload = () => {
    if (!currentPhoto) return;

    const link = document.createElement("a");
    link.href = currentPhoto.url;
    link.download = `photo-${currentPhoto.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getItemTitle = () => {
    if (item.type === "album") {
      return (item.data as Album).title;
    } else if (item.type === "event") {
      return (item.data as Event).name;
    }
    return null;
  };

  const itemTitle = getItemTitle();

  const handleShare = async () => {
    if (!currentPhoto) return;

    const shareUrl = `${window.location.origin}/photos/${currentPhoto.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentPhoto.description || "Поделиться фото",
          text: "Посмотри это фото в Campus Snaps!",
          url: shareUrl,
        });
      } catch (err) {
        navigator.clipboard
          .writeText(shareUrl)
          .then(() => alert("Ссылка скопирована в буфер обмена"));
      }
    } else {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => alert("Ссылка скопирована в буфер обмена"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Close button - always visible at the top right corner */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-gray-800"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Main modal container */}
      <div
        className={`relative mx-auto flex h-[90vh] w-[90vw] overflow-hidden rounded-lg bg-gray-900 shadow-2xl ${fullscreen ? "h-screen w-screen rounded-none" : ""}`}
      >
        {/* Left side - Photo display (65% width) */}
        <div className="relative flex h-full w-[65%] items-center justify-center bg-black">
          {/* Loading indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex items-center justify-center"
              >
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Album title if exists */}
          {itemTitle && (
            <div className="absolute left-0 top-0 z-20 w-full bg-gradient-to-b from-black/70 to-transparent px-5 py-4">
              <h2 className="text-xl font-bold text-white">{itemTitle}</h2>
            </div>
          )}

          {/* Photo counter */}
          {hasMultiplePhotos && (
            <div className="absolute right-5 top-5 z-20 rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur-sm">
              {currentIndex + 1} / {photos.length}
            </div>
          )}

          {/* Main image with zoom capabilities */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`photo-${currentIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoading ? 0.2 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
              {currentPhoto && (
                <TransformWrapper
                  initialScale={1}
                  minScale={0.5}
                  maxScale={4}
                  wheel={{ step: 0.1 }}
                  doubleClick={{ mode: "reset" }}
                  centerOnInit={true}
                  disabled={isLoading}
                >
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                      <TransformComponent
                        wrapperClass="h-full w-full"
                        contentClass="h-full w-full flex items-center justify-center"
                      >
                        <ImageWithCache
                          src={currentPhoto.url}
                          alt={currentPhoto.description || "Фото"}
                          width={1600}
                          height={1600}
                          className="max-h-full max-w-full object-contain"
                          onLoadingComplete={handleImageLoad}
                          priority={true}
                        />
                      </TransformComponent>

                      {/* Zoom controls */}
                      <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            zoomIn();
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-gray-800/80"
                          title="Приблизить"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            zoomOut();
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-gray-800/80"
                          title="Отдалить"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18 12H6"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resetTransform();
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-gray-800/80"
                          title="Сбросить масштаб"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2"
                            />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </TransformWrapper>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons for multiple photos */}
          {hasMultiplePhotos && (
            <>
              {currentIndex > 0 && (
                <button
                  onClick={goToPrev}
                  className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur-sm transition-colors hover:bg-gray-800"
                  disabled={isAnimating}
                  title="Предыдущее фото (←)"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}

              {currentIndex < photos.length - 1 && (
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur-sm transition-colors hover:bg-gray-800"
                  disabled={isAnimating}
                  title="Следующее фото (→)"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </>
          )}

          {/* Utility buttons (bottom left) */}
          <div className="absolute bottom-5 left-5 z-20 flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-gray-800/80"
              title="Полный экран (f)"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {fullscreen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2"
                  />
                )}
              </svg>
            </button>
            <button
              onClick={handleDownload}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-gray-800/80"
              title="Скачать фото"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
            <button
              onClick={handleShare}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-gray-800/80"
              title="Поделиться"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Right side - Info and comments (35% width) */}
        <div className="flex h-full w-[35%] flex-col border-l border-gray-800 bg-gray-900">
          {/* User info section */}
          <div className="border-b border-gray-800 p-5">
            {currentPhoto?.user && (
              <div className="flex items-center">
                {currentPhoto.user.image && (
                  <ImageWithCache
                    src={currentPhoto.user.image}
                    alt={currentPhoto.user.name || ""}
                    width={48}
                    height={48}
                    className="mr-3 rounded-full border border-gray-700"
                  />
                )}
                <div>
                  <p className="font-medium text-white">
                    {currentPhoto.user.name ||
                      currentPhoto.user.email ||
                      "Пользователь"}
                  </p>
                  {currentPhoto.user.academicGroup && (
                    <p className="text-sm text-gray-300">
                      {currentPhoto.user.academicGroup.name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tab controls for Comments/Info */}
          <div className="grid grid-cols-2 border-b border-gray-800">
            <button
              className={`py-4 text-center font-medium transition-colors ${
                activeTab === "comments"
                  ? "border-b-2 border-blue-400 text-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("comments")}
            >
              Комментарии
            </button>
            <button
              className={`py-4 text-center font-medium transition-colors ${
                activeTab === "info"
                  ? "border-b-2 border-blue-400 text-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("info")}
            >
              Информация
            </button>
          </div>

          {/* Content area (scrollable) */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === "comments" ? (
              /* Comments tab */
              <>
                {currentPhoto?.comments && currentPhoto.comments.length > 0 ? (
                  <CommentList comments={currentPhoto.comments} />
                ) : (
                  <div className="flex h-40 flex-col items-center justify-center text-center text-gray-500">
                    <svg
                      className="mb-2 h-12 w-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p>Нет комментариев</p>
                    <p className="text-sm">
                      Будьте первым, кто оставит комментарий
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Info tab */
              <div className="space-y-4 text-gray-300">
                {/* Description */}
                {currentPhoto?.description && (
                  <div>
                    <h3 className="mb-1 text-sm font-medium text-gray-400">
                      Описание
                    </h3>
                    <p>{currentPhoto.description}</p>
                  </div>
                )}

                {/* Tags */}
                {currentPhoto?.tags && currentPhoto.tags.length > 0 && (
                  <div>
                    <h3 className="mb-1 text-sm font-medium text-gray-400">
                      Теги
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {currentPhoto.tags.map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="cursor-pointer rounded-full bg-blue-500/20 px-2 py-0.5 text-sm font-medium text-blue-300 hover:bg-blue-500/30"
                          onClick={() => {
                            onTagClick?.(tag.name);
                            onClose();
                          }}
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical info */}
                {currentPhoto?.metadata && (
                  <div>
                    <h3 className="mb-1 text-sm font-medium text-gray-400">
                      Технические данные
                    </h3>
                    <table className="w-full text-sm">
                      <tbody>
                        {currentPhoto.metadata.camera && (
                          <tr>
                            <td className="py-1 pr-2 text-gray-500">Камера</td>
                            <td>{currentPhoto.metadata.camera}</td>
                          </tr>
                        )}
                        {currentPhoto.metadata.lens && (
                          <tr>
                            <td className="py-1 pr-2 text-gray-500">
                              Объектив
                            </td>
                            <td>{currentPhoto.metadata.lens}</td>
                          </tr>
                        )}
                        {currentPhoto.metadata.focalLength && (
                          <tr>
                            <td className="py-1 pr-2 text-gray-500">
                              Фокусное расст.
                            </td>
                            <td>{currentPhoto.metadata.focalLength}</td>
                          </tr>
                        )}
                        {currentPhoto.metadata.aperture && (
                          <tr>
                            <td className="py-1 pr-2 text-gray-500">
                              Диафрагма
                            </td>
                            <td>{currentPhoto.metadata.aperture}</td>
                          </tr>
                        )}
                        {currentPhoto.metadata.exposureTime && (
                          <tr>
                            <td className="py-1 pr-2 text-gray-500">
                              Выдержка
                            </td>
                            <td>{currentPhoto.metadata.exposureTime}</td>
                          </tr>
                        )}
                        {currentPhoto.metadata.iso && (
                          <tr>
                            <td className="py-1 pr-2 text-gray-500">ISO</td>
                            <td>{currentPhoto.metadata.iso}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Upload date */}
                {currentPhoto?.uploadDate && (
                  <div>
                    <h3 className="mb-1 text-sm font-medium text-gray-400">
                      Загружено
                    </h3>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(currentPhoto.uploadDate), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="border-t border-gray-800 p-4">
            {/* Like section */}
            <div className="mb-4 flex items-center justify-between">
              <LikeButton
                initialLiked={liked}
                count={likeCount}
                onLike={handleLikeToggle}
                size="lg"
                showCount={true}
              />

              {activeTab === "comments" && (
                <span className="text-sm text-gray-400">
                  {currentPhoto?.comments?.length || 0} комментариев
                </span>
              )}
            </div>

            {/* Add comment form - only visible in comments tab */}
            {activeTab === "comments" && (
              <CommentForm
                photoId={currentPhoto?.id}
                inputRef={commentInputRef}
                onCommentAdded={(newComment) => {
                  console.log("Comment added", newComment);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
