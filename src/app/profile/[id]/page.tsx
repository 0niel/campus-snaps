"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Header } from "~/components/Header";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { EmptyState } from "~/components/EmptyState";
import { PhotoModal } from "~/components/PhotoModal";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import type { FeedItem } from "~/types";
import Image from "next/image";
import { CalendarIcon } from "@heroicons/react/24/outline";

export default function UserProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = params.id;

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [selectedPhoto, setSelectedPhoto] = useState<FeedItem | null>(null);

  const isOwnProfile = session?.user?.id === userId;

  useEffect(() => {
    if (isOwnProfile && status !== "loading") {
      router.push("/profile");
    }
  }, [isOwnProfile, router, status, userId]);

  const { data: userProfile, isLoading: isLoadingProfile } =
    api.user.getUserById.useQuery(
      { userId },
      {
        enabled: !!userId && !isOwnProfile,
      },
    );

  const { data: userPhotos, isLoading: isLoadingPhotos } =
    api.photo.getUserPhotosById.useQuery(
      {
        userId,
        limit: 50,
      },
      {
        enabled: !!userId && !isOwnProfile,
      },
    );

  const handlePhotoClick = (photo: FeedItem) => {
    setSelectedPhoto(photo);
    setIsPhotoModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const handleClosePhotoModal = () => {
    setIsPhotoModalOpen(false);
    setSelectedPhoto(null);
    document.body.style.overflow = "auto";
  };

  if (isOwnProfile) {
    return null;
  }

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!userProfile?.user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="mx-auto max-w-screen-lg px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-white">
            Пользователь не найден
          </h1>
          <p className="mt-4 text-gray-400">
            Пользователь с указанным ID не существует или был удален.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  const { user, stats } = userProfile;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header onUploadClick={() => {}} />

      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        {/* Profile Header */}
        <div className="mb-8 rounded-xl bg-gray-900 p-6 shadow-lg">
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
                    {stats.photosCount}
                  </span>
                  <span className="text-sm text-gray-400">Фото</span>
                </div>
                <div className="text-center">
                  <span className="block text-xl font-bold text-white">
                    {stats.eventsCount}
                  </span>
                  <span className="text-sm text-gray-400">Мероприятия</span>
                </div>
                <div className="text-center">
                  <span className="block text-xl font-bold text-white">
                    {stats.likesCount}
                  </span>
                  <span className="text-sm text-gray-400">Лайки</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Photos Section */}
        <div className="mb-6 flex items-center">
          <h2 className="text-xl font-bold text-white">Фотографии</h2>
          <span className="ml-2 rounded-full bg-gray-800 px-2 py-0.5 text-sm text-gray-400">
            {stats.photosCount}
          </span>
        </div>

        {isLoadingPhotos ? (
          <div className="flex h-60 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : !userPhotos?.items.length ? (
          <div className="rounded-xl bg-gray-900 p-8 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-lg font-medium text-white">
              Нет фотографий
            </h3>
            <p className="mt-1 text-gray-400">
              У этого пользователя пока нет загруженных фотографий.
            </p>
          </div>
        ) : (
          <PhotoGrid items={userPhotos.items} onPhotoClick={handlePhotoClick} />
        )}
      </main>

      {/* Photo Modal */}
      {isPhotoModalOpen && selectedPhoto && (
        <PhotoModal
          item={selectedPhoto}
          onClose={handleClosePhotoModal}
          onTagClick={() => {}}
        />
      )}
    </div>
  );
}
