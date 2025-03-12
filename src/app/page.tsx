"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Header } from "~/components/Header";
import { Calendar } from "~/components/Calendar";
import { UploadModal } from "~/components/UploadModal";
import { PhotoModal } from "~/components/PhotoModal";
import { WelcomeBanner } from "~/components/WelcomeBanner";
import { FeedNavigation } from "~/components/FeedNavigation";
import { TagsFilter } from "~/components/TagsFilter";
import { EmptyState } from "~/components/EmptyState";
import { FeaturedEvents } from "~/components/FeaturedEvents";
import { FeedLayout } from "~/components/FeedLayout";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import type { FeedItem } from "~/types";
import { api } from "~/trpc/react";
import { processSmartFeed } from "~/utils/feedUtils";
import { registerServiceWorker, cacheImages } from "~/utils/serviceWorker";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    registerServiceWorker();
  }, []);

  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [feedView, setFeedView] = useState<"all" | "groups" | "events">("all");
  const [page, setPage] = useState<number>(0);

  const [activeItem, setActiveItem] = useState<FeedItem | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  const {
    data: feedData,
    isLoading: isLoadingFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.photo.getFeed.useInfiniteQuery(
    {
      limit: 20,
      tag: activeTag || undefined,
      date: selectedDate || undefined,
      view: feedView,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const rawFeedItems = feedData?.pages.flatMap((page) => page.items) || [];
  const processedFeedItems = React.useMemo(() => {
    if (rawFeedItems.length === 0) return [];

    return processSmartFeed(rawFeedItems);
  }, [rawFeedItems]);

  useEffect(() => {
    if (processedFeedItems.length > 0) {
      const imageUrls = processedFeedItems
        .flatMap((item) => {
          if (item.type === "photo") {
            return [item.data.url];
          } else if (item.type === "album" && item.data.photos?.length > 0) {
            return [item.data.photos[0].photo.url];
          } else if (
            item.type === "userPhotos" ||
            item.type === "groupPhotos"
          ) {
            return (item.data.photos || []).map((photo) => photo.url);
          } else if (item.type === "event" && item.data.photos?.length > 0) {
            return [item.data.photos[0].url];
          }
          return [];
        })
        .filter(Boolean);

      if (imageUrls.length > 0) {
        cacheImages(imageUrls);
      }
    }
  }, [processedFeedItems]);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0.5 },
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const openPhotoModal = (item: FeedItem, photoIndex: number = 0) => {
    setActiveItem(item);
    setActivePhotoIndex(photoIndex);
    document.body.style.overflow = "hidden";
  };

  const closePhotoModal = () => {
    setActiveItem(null);
    setActivePhotoIndex(0);
    document.body.style.overflow = "auto";
  };

  const handleDateSelect = (date: Date) => {
    if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [activeTag, selectedDate, feedView]);

  const handleTagClick = (tag: string) => {
    setActiveTag(tag);
    closePhotoModal();
  };

  if (!mounted) return null;

  const isEmptyWithFilters =
    processedFeedItems.length === 0 &&
    (selectedDate || activeTag) &&
    !isLoadingFeed;

  const isEmptyCategory =
    processedFeedItems.length === 0 &&
    !selectedDate &&
    !activeTag &&
    feedView !== "all" &&
    !isLoadingFeed;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <Header
        onUploadClick={() => setIsUploadModalOpen(true)}
        onCalendarToggle={() => setShowCalendar(!showCalendar)}
        showCalendar={showCalendar}
      />

      {/* Main content */}
      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        {/* Welcome Banner */}
        <WelcomeBanner onUploadClick={() => setIsUploadModalOpen(true)} />

        {/* Feed Navigation */}
        <FeedNavigation
          activeFeed={feedView}
          onFeedChange={setFeedView}
          showCalendar={showCalendar}
          onCalendarToggle={() => setShowCalendar(!showCalendar)}
        />

        {/* Tags Filter */}
        <TagsFilter
          activeTag={activeTag}
          onTagClick={setActiveTag}
          selectedDate={selectedDate}
          onDateClear={() => setSelectedDate(null)}
        />

        {/* Calendar */}
        <AnimatePresence>
          {showCalendar && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="rounded-xl bg-gray-900 p-5 shadow-lg">
                <Calendar
                  onSelectDate={handleDateSelect}
                  selectedDate={selectedDate}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty states */}
        {isEmptyWithFilters && (
          <EmptyState
            type="filtered"
            tag={activeTag}
            date={selectedDate}
            onReset={() => {
              setActiveTag(null);
              setSelectedDate(null);
            }}
          />
        )}

        {isEmptyCategory && (
          <EmptyState
            type="category"
            view={feedView}
            onReset={() => setFeedView("all")}
          />
        )}

        {/* Featured sections based on view */}
        {feedView === "events" &&
          processedFeedItems.length > 0 &&
          !selectedDate &&
          !activeTag && <FeaturedEvents onItemClick={openPhotoModal} />}

        {/* Main feed content */}
        {processedFeedItems.length > 0 ? (
          <FeedLayout
            items={processedFeedItems}
            onItemClick={openPhotoModal}
            onPhotoClick={(item, index) => openPhotoModal(item, index)}
            onTagClick={handleTagClick}
          />
        ) : (
          !isEmptyWithFilters &&
          !isEmptyCategory &&
          isLoadingFeed && (
            <div className="py-6 text-center text-gray-500">
              <LoadingSpinner />
            </div>
          )
        )}

        {/* Loading indicator for pagination */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-6">
            <LoadingSpinner />
          </div>
        )}

        {/* Infinite scroll trigger element */}
        <div ref={loadMoreRef} className="h-10" />
      </main>

      {/* Modals */}
      {activeItem && (
        <PhotoModal
          item={activeItem}
          initialPhotoIndex={activePhotoIndex}
          onClose={closePhotoModal}
          onTagClick={handleTagClick}
        />
      )}

      {isUploadModalOpen && (
        <UploadModal onClose={() => setIsUploadModalOpen(false)} />
      )}
    </div>
  );
}
