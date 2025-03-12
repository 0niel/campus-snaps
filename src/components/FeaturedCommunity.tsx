import React from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/utils/api";

export const FeaturedCommunity: React.FC = () => {
  const { data, isLoading } = api.group.getCommunities.useQuery({ limit: 1 });

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold">Студенческие сообщества</h2>
        <div className="h-64 animate-pulse rounded-xl bg-gray-800 p-5 shadow-sm"></div>
      </div>
    );
  }

  if (!data?.communities.length) return null;

  const community = data.communities[0];

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl font-bold">Студенческие сообщества</h2>
      <div className="rounded-xl border border-purple-900/30 bg-gray-900 p-5 text-white shadow-sm">
        <div className="flex flex-col items-start gap-6 md:flex-row">
          <div className="w-full md:w-1/3">
            <div className="aspect-square overflow-hidden rounded-xl bg-purple-900/30 md:aspect-auto md:h-full">
              <Image
                src={
                  community.recentPhotos?.[0]?.url ||
                  "https://picsum.photos/400/400?community"
                }
                alt={community.name}
                width={400}
                height={400}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="w-full md:w-2/3">
            <h3 className="mb-2 text-xl font-bold text-purple-300">
              {community.name}
            </h3>
            <p className="mb-4 text-gray-300">
              {community.description ||
                "Объединение студентов университета для организации мероприятий, развития студенческой жизни и представления интересов учащихся."}
            </p>
            <div className="mb-4 flex items-center">
              <div className="flex -space-x-2">
                {community.members?.slice(0, 3).map((member, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 overflow-hidden rounded-full border-2 border-gray-900"
                  >
                    <Image
                      src={member.image || "https://via.placeholder.com/40"}
                      alt=""
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <span className="ml-3 text-sm text-gray-400">
                {community._count?.users || 0}+ участников
              </span>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {community.tags?.slice(0, 5).map((tag, i) => (
                <span
                  key={i}
                  className="rounded-full bg-purple-900/40 px-2 py-1 text-xs text-purple-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <Link
              href={`/groups?id=${community.id}`}
              className="inline-block rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
            >
              Присоединиться
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
