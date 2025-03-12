"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Header } from "~/components/Header";
import { PhotoModal } from "~/components/PhotoModal";
import Masonry from "react-masonry-css";

type Tag = {
  id: number;
  name: string;
  count: number;
};

type Photo = {
  id: number;
  url: string;
  description: string | null;
  uploadDate: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    academicGroup?: { name: string } | null;
  };
  likes: { userId: string }[];
  comments: { id: number }[];
  tags: { tag: { id: number; name: string } }[];
};

type FeedItem = {
  id: number;
  type: string;
  data: any;
  date: Date;
  title?: string;
};

const TAGS: Tag[] = [
  { id: 1, name: "университет", count: 124 },
  { id: 2, name: "архитектура", count: 98 },
  { id: 3, name: "мероприятия", count: 85 },
  { id: 4, name: "студенты", count: 132 },
  { id: 5, name: "наука", count: 52 },
  { id: 6, name: "спорт", count: 79 },
  { id: 7, name: "природа", count: 64 },
  { id: 8, name: "библиотека", count: 39 },
  { id: 9, name: "дипломы", count: 27 },
  { id: 10, name: "столовая", count: 41 },
  { id: 11, name: "конференция", count: 36 },
  { id: 12, name: "выставка", count: 48 },
  { id: 13, name: "праздники", count: 68 },
  { id: 14, name: "экзамены", count: 42 },
  { id: 15, name: "друзья", count: 94 },
  { id: 16, name: "кампус", count: 112 },
];

const getRandomTags = () => {
  const numTags = 1 + Math.floor(Math.random() * 3);
  const shuffled = [...TAGS].sort(() => 0.5 - Math.random());
  return shuffled
    .slice(0, numTags)
    .map((tag) => ({ tag: { id: tag.id, name: tag.name } }));
};

const generateMockPhotos = (count: number): Photo[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    url: `https://picsum.photos/${300 + (i % 5) * 100}/${350 + (i % 4) * 100}?random=${i + 1}`,
    description:
      i % 3 === 0 ? `Интересный момент из жизни университета #${i + 1}` : null,
    uploadDate: new Date(Date.now() - i * 3600000 * 24),
    user: {
      id: `user${(i % 8) + 1}`,
      name: ["Сергей Дмитриев", "Дмитрий Сергеев", "Алексей Иванов"][i % 3],
      image: `https://i.pravatar.cc/150?img=${(i % 10) + 1}`,
      academicGroup: {
        name: ["ИКБО-30-20", "ИКБО-30-21", "ИКБО-24-20"][i % 3],
      },
    },
    likes: Array(Math.floor(Math.random() * 50) + 10).fill({ userId: "" }),
    comments: Array(Math.floor(Math.random() * 15)).fill({ id: 0 }),
    tags: getRandomTags(),
  }));
};

const mockTrendingPhotos: Photo[] = generateMockPhotos(30);

export default function ExplorePage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"trending" | "tags">("trending");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>(mockTrendingPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedTag) {
      const filteredPhotos = mockTrendingPhotos.filter((photo) =>
        photo.tags.some((tag) => tag.tag.name === selectedTag),
      );
      setPhotos(
        filteredPhotos.length > 0
          ? filteredPhotos
          : mockTrendingPhotos.slice(0, 15).sort(() => Math.random() - 0.5),
      );
    } else {
      setPhotos(mockTrendingPhotos);
    }
  }, [selectedTag]);

  const handleTagClick = (tagName: string) => {
    setSelectedTag(selectedTag === tagName ? null : tagName);
    setActiveTab("tags");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onUploadClick={() => setIsUploadModalOpen(true)}
        showCalendar={false}
      />

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Обзор фотографий
          </h1>
          <p className="text-gray-600">
            Исследуйте популярные фотографии или просматривайте по категориям
          </p>
        </div>

        {/* Tab navigation */}
        <div className="mb-8 flex space-x-1 border-b">
          <button
            onClick={() => setActiveTab("trending")}
            className={`px-4 pb-2 font-medium transition-colors ${activeTab === "trending" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-blue-600"}`}
          >
            Популярное
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`px-4 pb-2 font-medium transition-colors ${activeTab === "tags" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-blue-600"}`}
          >
            Теги
          </button>
        </div>

        {/* Trending photos section */}
        {activeTab === "trending" && (
          <>
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-medium text-gray-900">
                Что популярно сейчас
              </h2>
              <p className="text-gray-600">
                Самые популярные фотографии в университете на этой неделе
              </p>
            </div>

            <Masonry
              breakpointCols={{ default: 4, 1100: 3, 700: 2, 500: 1 }}
              className="-ml-4 flex w-auto"
              columnClassName="pl-4 bg-clip-padding"
            >
              {photos.map((photo) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="group relative mb-4 cursor-pointer overflow-hidden rounded-lg shadow-sm hover:shadow-md"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="aspect-[3/4] bg-gray-100">
                    <Image
                      src={photo.url}
                      alt={photo.description ?? "Фотография"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <div className="mb-1 flex items-center space-x-2">
                        {photo.user.image && (
                          <Image
                            src={photo.user.image}
                            alt={photo.user.name ?? ""}
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                        )}
                        <span className="text-xs font-medium">
                          {photo.user.name}
                        </span>
                      </div>

                      {photo.description && (
                        <p className="line-clamp-2 text-sm text-white/90">
                          {photo.description}
                        </p>
                      )}

                      <div className="mt-2 flex items-center justify-between text-xs text-white/90">
                        <span>{photo.likes.length} лайков</span>
                        <span>{photo.comments.length} комментариев</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </Masonry>
          </>
        )}

        {/* Tags browsing section */}
        {activeTab === "tags" && (
          <div className="mb-6">
            <h2 className="mb-4 text-xl font-medium text-gray-900">
              Обзор по тегам
            </h2>

            <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {TAGS.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() =>
                    setSelectedTag(selectedTag === tag.name ? null : tag.name)
                  }
                  className={`rounded-lg border p-2 text-left transition ${
                    selectedTag === tag.name
                      ? "border-blue-200 bg-blue-50 text-blue-800"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <p className="font-medium">#{tag.name}</p>
                  <p className="text-xs text-gray-500">{tag.count} фото</p>
                </button>
              ))}
            </div>

            {selectedTag && (
              <div className="mt-6">
                <h3 className="mb-3 flex items-center font-medium">
                  <span>#{selectedTag}</span>
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    (очистить)
                  </button>
                </h3>

                <Masonry
                  breakpointCols={{ default: 4, 1100: 3, 700: 2, 500: 1 }}
                  className="-ml-4 flex w-auto"
                  columnClassName="pl-4 bg-clip-padding"
                >
                  {photos.map((photo) => (
                    <motion.div
                      key={`tag-${photo.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="group relative mb-4 cursor-pointer overflow-hidden rounded-lg shadow-sm hover:shadow-md"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <div className="aspect-[3/4] bg-gray-100">
                        <Image
                          src={photo.url}
                          alt={photo.description ?? "Фотография"}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          {photo.tags.some(
                            (t) => t.tag.name === selectedTag,
                          ) && (
                            <span className="mb-1 inline-block rounded-full bg-blue-600/80 px-2 py-0.5 text-xs text-white">
                              #{selectedTag}
                            </span>
                          )}

                          {photo.description && (
                            <p className="line-clamp-2 text-sm text-white/90">
                              {photo.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </Masonry>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Photo Modal */}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onTagClick={handleTagClick}
        />
      )}
    </div>
  );
}
