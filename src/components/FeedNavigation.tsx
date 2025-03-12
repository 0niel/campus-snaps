import React from "react";

interface FeedNavigationProps {
  activeFeed: "all" | "groups" | "events" | "community";
  onFeedChange: (feed: "all" | "groups" | "events" | "community") => void;
  showCalendar: boolean;
  onCalendarToggle: () => void;
}

export const FeedNavigation: React.FC<FeedNavigationProps> = ({
  activeFeed,
  onFeedChange,
  showCalendar,
  onCalendarToggle,
}) => {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div className="flex gap-2 overflow-x-auto rounded-full bg-gray-900 p-1">
        <button
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            activeFeed === "all"
              ? "bg-blue-500 text-white shadow-lg"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
          onClick={() => onFeedChange("all")}
        >
          Все фото
        </button>
        <button
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            activeFeed === "events"
              ? "bg-blue-500 text-white shadow-lg"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
          onClick={() => onFeedChange("events")}
        >
          Мероприятия
        </button>
        <button
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            activeFeed === "groups"
              ? "bg-blue-500 text-white shadow-lg"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
          onClick={() => onFeedChange("groups")}
        >
          Группы
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onCalendarToggle}
          className={`flex items-center rounded-full px-4 py-2 text-sm transition-all ${
            showCalendar
              ? "bg-blue-500 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Календарь
        </button>
      </div>
    </div>
  );
};
