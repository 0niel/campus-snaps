import React, { useState } from 'react';
import Masonry from "react-masonry-css";
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoCard } from '~/components/PhotoCard';
import { AlbumCard } from '~/components/AlbumCard';
import { EventCard } from '~/components/EventCard';
import { OrganizationCard } from "~/components/OrganizationCard";
import Image from 'next/image';
import Link from 'next/link';
import { type FeedItem, type Photo, type Album, type Event, type User, type AcademicGroup } from '~/types';

type FeedViewProps = {
  items: FeedItem[];
  onPhotoOpen: (item: FeedItem, photoIndex?: number) => void;
  onTagClick?: (tag: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  columns?: {
    default: number;
    1280: number;
    1024: number;
    768: number;
    640: number;
  };
  showFilters?: boolean;
  dateFilter?: Date | null;
  onDateFilterClear?: () => void;
  tagFilter?: string | null;
  onTagFilterClear?: () => void;
};

export function FeedView({ 
  items, 
  onPhotoOpen, 
  onTagClick,
  loading = false,
  emptyMessage = "Нет доступных фотографий",
  emptyIcon,
  columns = {
    default: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 1,
  },
  showFilters = false,
  dateFilter = null,
  onDateFilterClear,
  tagFilter = null,
  onTagFilterClear,
}: FeedViewProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const renderGroupPhotos = (data: { group: AcademicGroup; photos: Photo[] }) => {
    const { group, photos } = data;
    const isOrg = group.name === "Студенческий Медиацентр" || group.name === "Студенческий союз";

    return (
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={`mb-5 overflow-hidden rounded-xl bg-gray-900 shadow-lg ${
          isOrg ? "border-l-4 border-purple-500" : ""
        }`}
      >
        <div
          className={`p-4 ${
            isOrg 
              ? "bg-gradient-to-r from-purple-900/50 to-gray-900" 
              : "bg-gradient-to-r from-blue-900/30 to-gray-900"
          }`}
        >
          <h3
            className={`flex items-center font-medium ${
              isOrg ? "text-purple-300" : "text-blue-300"
            }`}
          >
            <svg
              className="mr-1.5 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {group.name}
            {isOrg && (
              <span className="ml-2 rounded-full bg-purple-900/80 px-2 py-0.5 text-xs text-purple-200">
                Организация
              </span>
            )}
          </h3>
          {group.description && (
            <p
              className={`ml-5.5 text-xs ${
                isOrg ? "text-purple-300/70" : "text-blue-300/70"
              }`}
            >
              {group.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-0.5 p-0.5">
          {photos.map((photo, idx) => (
            <div
              key={`group-photo-${photo.id}`}
              className={`cursor-pointer overflow-hidden ${idx === 0 ? "col-span-2" : ""}`}
              onClick={() =>
                onPhotoOpen({
                  id: photo.id,
                  type: "photo",
                  data: photo,
                  date: photo.uploadDate,
                })
              }
            >
              <div className="relative">
                <div
                  className={`${idx === 0 ? "aspect-[16/9]" : "aspect-square"} bg-gray-800`}
                >
                  <Image
                    src={photo.url}
                    alt={photo.description || "Фото группы"}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-gray-800 p-3 text-xs">
          <Link
            href={`/groups?id=${group.id}`}
            className={`flex items-center font-medium transition-colors ${
              isOrg 
                ? "text-purple-400 hover:text-purple-300" 
                : "text-blue-400 hover:text-blue-300"
            }`}
          >
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
            {isOrg ? "Перейти в организацию" : "Перейти в группу"}
          </Link>
        </div>
      </motion.div>
    );
  };

  const renderUserPhotos = (data: { user: User; photos: Photo[] }, itemId: string | number) => {
    const { user, photos } = data;
    const isOrg = user.academicGroup?.name === "Студенческий Медиацентр" || 
                 user.academicGroup?.name === "Студенческий союз";
    const id = `userPhotos-${itemId}`;
    const isItemHovered = hovered === id;

    if (isOrg) {
      return (
        <OrganizationCard
          user={user}
          photos={photos}
          onOpen={(item) => onPhotoOpen(item)}
          title={`Новые фотографии от организации`}
        />
      );
    }

    return (
      <motion.div 
        whileHover={{ y: -4 }}
        onHoverStart={() => setHovered(id)}
        onHoverEnd={() => setHovered(null)}
        className="overflow-hidden rounded-xl bg-gray-900 shadow-lg"
      >
        <div className="border-b border-gray-800 p-3">
          <div className="flex items-center">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name || ""}
                width={36}
                height={36}
                className="mr-3 rounded-full"
              />
            )}
            <div>
              <h3 className="font-medium text-white">{user.name}</h3>
              {user.academicGroup && (
                <p className="text-xs text-gray-400">{user.academicGroup.name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0.5 p-0.5">
          {photos.slice(0, 4).map((photo, index) => (
            <div
              key={`user-photo-${photo.id}`}
              className={`relative cursor-pointer ${index === 0 ? "col-span-2" : ""}`}
              onClick={() => onPhotoOpen({
                id: photo.id,
                type: "photo",
                data: photo,
                date: photo.uploadDate,
              })}
            >
              <div className={`${index === 0 ? "aspect-[16/9]" : "aspect-square"} overflow-hidden bg-gray-800`}>
                <Image
                  src={photo.url}
                  alt={photo.description || "Фото пользователя"}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-gray-800 p-3 text-xs text-gray-400">
          <button 
            className="flex items-center font-medium text-blue-400 transition-colors hover:text-blue-300"
            onClick={() => onPhotoOpen({
              id: `user-${user.id}` as unknown as number,
              type: "userPhotos",
              data: { user, photos },
              date: photos[0].uploadDate
            })}
          >
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
    );
  };

  const renderItem = (item: FeedItem) => {
    const { type, data } = item;

    switch (type) {
      case "photo":
        return <PhotoCard photo={data as Photo} onOpen={() => onPhotoOpen(item)} onTagClick={onTagClick} />;
      case "album":
        return <AlbumCard album={data as Album} onOpen={() => onPhotoOpen(item)} />;
      case "event":
        return <EventCard event={data as Event} onOpen={() => onPhotoOpen(item)} />;
      case "userPhotos":
        return renderUserPhotos(data as { user: User; photos: Photo[] }, item.id);
      case "groupPhotos":
        return renderGroupPhotos(data as { group: AcademicGroup; photos: Photo[] });
      default:
        return null;
    }
  };

  
  const renderFilters = () => {
    if (!showFilters || (!dateFilter && !tagFilter)) return null;
    
    return (
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {dateFilter && (
          <div className="flex items-center rounded-full bg-blue-500/10 px-3 py-1.5 text-sm text-blue-600">
            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {dateFilter.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'})}
            {onDateFilterClear && (
              <button 
                onClick={onDateFilterClear}
                className="ml-1.5 rounded-full p-0.5 hover:bg-blue-500/20"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {tagFilter && (
          <div className="flex items-center rounded-full bg-blue-500/10 px-3 py-1.5 text-sm text-blue-600">
            #{tagFilter}
            {onTagFilterClear && (
              <button 
                onClick={onTagFilterClear}
                className="ml-1.5 rounded-full p-0.5 hover:bg-blue-500/20"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  
  if (items.length === 0) {
    return (
      <div className="flex min-h-[200px] w-full flex-col items-center justify-center rounded-xl bg-gray-900 p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
          {emptyIcon || (
            <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
        <p className="mb-2 text-lg font-medium text-gray-300">{emptyMessage}</p>
        
        {(dateFilter || tagFilter) && (
          <div className="mt-2 flex items-center gap-2">
            <button
              className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-300"
              onClick={() => {
                onDateFilterClear?.();
                onTagFilterClear?.();
              }}
            ></button>
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {renderFilters()}
      
      <Masonry
        breakpointCols={columns}
        className="-ml-4 flex w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        {items.map((item) => (
          <div key={`${item.type}-${item.id}`}>{renderItem(item)}</div>
        ))}
      </Masonry>
      
      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>
        </div>
      )}
    </>
  );
}