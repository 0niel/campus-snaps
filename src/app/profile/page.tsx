"use client";

import React, { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { Header } from "~/components/Header";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { PhotoGrid } from "~/components/PhotoGrid";
import { ProfileHeader } from "~/components/ProfileHeader";
import { ProfileTabs } from "~/components/ProfileTabs";
import { EditProfileModal } from "~/components/EditProfileModal";
import { EmptyState } from "~/components/EmptyState";
import { PhotoModal } from "~/components/PhotoModal";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import type { FeedItem } from "~/types";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"photos" | "events" | "likes">(
    "photos",
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [selectedPhoto, setSelectedPhoto] = useState<FeedItem | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const { data: userProfile, isLoading: isLoadingProfile } =
    api.user.getProfile.useQuery(undefined, {
      enabled: !!session?.user,
      retry: false,
      onError: (error) => {
        console.error("Failed to load profile:", error);
      },
    });

  const { data: userPhotos, isLoading: isLoadingPhotos } =
    api.user.getPhotos.useQuery(
      {
        userId: session?.user?.id || "",
        limit: 50,
      },
      {
        enabled: !!session?.user && activeTab === "photos",
      },
    );

  const isLoadingEvents = false;
  const userEvents = { events: [] };

  const { data: userLikes, isLoading: isLoadingLikes } =
    api.photo.getUserLikes?.useQuery(
      {
        limit: 50,
      },
      {
        enabled: !!session?.user && activeTab === "likes",
      },
    ) || { data: { items: [] }, isLoading: false };

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

  const isCurrentTabLoading = () => {
    if (activeTab === "photos") return isLoadingPhotos;
    if (activeTab === "events") return isLoadingEvents;
    if (activeTab === "likes") return isLoadingLikes;
    return false;
  };

  const isCurrentTabEmpty = () => {
    if (activeTab === "photos") return !userPhotos?.items?.length;
    if (activeTab === "events") return !userEvents?.events?.length;
    if (activeTab === "likes") return !userLikes?.items?.length;
    return true;
  };

  const convertToFeedItems = (): FeedItem[] => {
    switch (activeTab) {
      case "photos":
        return (userPhotos?.photos || []).map((photo) => ({
          id: String(photo.id),
          type: "photo",
          data: photo,
        }));
      case "likes":
        return userLikes?.items || [];
      default:
        return [];
    }
  };

  if (status === "loading" || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header onUploadClick={() => {}} />

      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        {/* Profile Header */}
        <ProfileHeader
          user={userProfile?.user}
          stats={userProfile?.stats}
          onEditClick={() => setIsEditModalOpen(true)}
          onLogoutClick={() => void signOut()}
        />

        {/* Profile Tabs */}
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          photosCount={userProfile?.stats.photosCount || 0}
          eventsCount={userProfile?.stats.eventsCount || 0}
          likesCount={userProfile?.stats.likesCount || 0}
        />

        {/* Tab Content */}
        <div className="mt-6">
          {isCurrentTabLoading() ? (
            <div className="flex h-60 items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : isCurrentTabEmpty() ? (
            <EmptyState type="profile" view={activeTab} onReset={() => {}} />
          ) : (
            <>
              {activeTab === "photos" || activeTab === "likes" ? (
                <PhotoGrid
                  items={convertToFeedItems()}
                  onPhotoClick={handlePhotoClick}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {userEvents?.events.map((event) => (
                    <div
                      key={event.id}
                      className="cursor-pointer rounded-lg bg-gray-900 p-4 transition hover:bg-gray-800"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      <h3 className="text-lg font-medium text-white">
                        {event.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {new Date(event.date).toLocaleDateString("ru-RU")}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-gray-300">
                        {event.description || "Нет описания"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      {isEditModalOpen && (
        <EditProfileModal
          user={userProfile?.user}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

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
