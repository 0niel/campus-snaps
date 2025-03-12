import React from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/react";

export const FeaturedGroups: React.FC = () => {
  const { data, isLoading } = api.group.getAll.useQuery({
    limit: 5,
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold">Популярные группы</h2>
        <div className="scrollbar-hide flex space-x-4 overflow-x-auto pb-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`skeleton-group-${index}`}
              className="h-48 w-64 flex-shrink-0 animate-pulse rounded-xl bg-gray-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.groups.length) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl font-bold">Популярные группы</h2>
      <div className="scrollbar-hide flex space-x-4 overflow-x-auto pb-4">
        {data.groups.map((group) => (
          <div
            key={`featured-group-${group.id}`}
            className="w-64 flex-shrink-0 overflow-hidden rounded-xl bg-gray-900 text-white shadow-sm"
          >
            <div className="h-20 bg-gradient-to-r from-blue-900/50 to-gray-900 p-4">
              <h3 className="font-bold text-blue-300">{group.name}</h3>
              {group.description && (
                <p className="truncate text-xs text-blue-200/70">
                  {group.description}
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1 p-2">
              {group.recentPhotos?.slice(0, 3).map((photo) => (
                <div
                  key={`group-thumb-${photo.id}`}
                  className="aspect-square overflow-hidden rounded bg-gray-800"
                >
                  <Image
                    src={photo.url}
                    alt=""
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}

              {/* Fill empty slots with placeholders if not enough photos */}
              {Array.from({
                length: Math.max(0, 3 - (group.recentPhotos?.length || 0)),
              }).map((_, i) => (
                <div
                  key={`placeholder-${i}`}
                  className="aspect-square rounded bg-gray-800"
                />
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-gray-800 p-3">
              <Link
                href={`/groups?id=${group.id}`}
                className="text-xs font-medium text-blue-400"
              >
                Перейти в группу →
              </Link>
              <span className="text-xs text-gray-400">
                {group._count?.users || 0} участников
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
