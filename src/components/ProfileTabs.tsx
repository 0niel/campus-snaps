import React from "react";
import {
  PhotoIcon,
  CalendarIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

type TabType = "photos" | "events" | "likes";

interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  photosCount: number;
  eventsCount: number;
  likesCount: number;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  photosCount,
  eventsCount,
  likesCount,
}) => {
  return (
    <div className="border-b border-gray-800">
      <nav className="-mb-px flex" aria-label="Tabs">
        <button
          onClick={() => onTabChange("photos")}
          className={`inline-flex items-center border-b-2 px-4 py-3 text-sm font-medium ${
            activeTab === "photos"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:border-gray-700 hover:text-gray-300"
          }`}
        >
          <PhotoIcon className="mr-2 h-5 w-5" />
          <span>Фото</span>
          {photosCount > 0 && (
            <span className="ml-2 rounded-full bg-gray-800 px-2 py-0.5 text-xs">
              {photosCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange("events")}
          className={`inline-flex items-center border-b-2 px-4 py-3 text-sm font-medium ${
            activeTab === "events"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:border-gray-700 hover:text-gray-300"
          }`}
        >
          <CalendarIcon className="mr-2 h-5 w-5" />
          <span>Мероприятия</span>
          {eventsCount > 0 && (
            <span className="ml-2 rounded-full bg-gray-800 px-2 py-0.5 text-xs">
              {eventsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange("likes")}
          className={`inline-flex items-center border-b-2 px-4 py-3 text-sm font-medium ${
            activeTab === "likes"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:border-gray-700 hover:text-gray-300"
          }`}
        >
          <HeartIcon className="mr-2 h-5 w-5" />
          <span>Понравилось</span>
          {likesCount > 0 && (
            <span className="ml-2 rounded-full bg-gray-800 px-2 py-0.5 text-xs">
              {likesCount}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
};
