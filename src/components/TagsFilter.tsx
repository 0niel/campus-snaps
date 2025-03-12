import React from "react";
import { api } from "~/trpc/react";

interface TagsFilterProps {
  activeTag: string | null;
  onTagClick: (tag: string | null) => void;
  selectedDate: Date | null;
  onDateClear: () => void;
}

export const TagsFilter: React.FC<TagsFilterProps> = ({
  activeTag,
  onTagClick,
  selectedDate,
  onDateClear,
}) => {
  const { data, isLoading } = api.tag.getPopular.useQuery({ limit: 8 });
  const tags = data?.tags;

  return (
    <div className="mb-8">
      <div className="scrollbar-hide flex flex-wrap gap-2">
        <button
          className={`rounded-full px-4 py-2 text-sm transition-all ${
            !activeTag
              ? "bg-blue-500 font-medium text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
          onClick={() => onTagClick(null)}
        >
          Все теги
        </button>

        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`skeleton-tag-${index}`}
                className="h-8 w-24 animate-pulse rounded-full bg-gray-800"
              />
            ))
          : tags?.map((tag) => (
              <button
                key={tag.id}
                className={`rounded-full px-4 py-2 text-sm transition-all ${
                  activeTag === tag.name
                    ? "bg-blue-500 font-medium text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                onClick={() => onTagClick(tag.name)}
              >
                #{tag.name}
              </button>
            ))}

        {/* Date filter display */}
        {selectedDate && (
          <div className="ml-auto flex items-center rounded-full bg-blue-500 px-4 py-2 text-sm text-white">
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
            {selectedDate.toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
            })}
            <button onClick={onDateClear} className="ml-2">
              <svg
                className="h-4 w-4"
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
          </div>
        )}
      </div>
    </div>
  );
};
