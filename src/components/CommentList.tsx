import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { ImageWithCache } from "~/components/ImageWithCache";
import type { Comment } from "~/types";

interface CommentListProps {
  comments: Comment[];
}

export const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-lg bg-gray-800 p-3">
          <div className="flex items-start space-x-3">
            {comment.user.image ? (
              <ImageWithCache
                src={comment.user.image}
                alt={comment.user.name || comment.user.email || ""}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white">
                {(comment.user.name || comment.user.email || "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between">
                <p className="font-medium text-white">
                  {comment.user.name ||
                    comment.user.email ||
                    "Неизвестный пользователь"}
                </p>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
              </div>
              <p className="mt-1 text-gray-300">{comment.text}</p>

              {/* Comment actions */}
              <div className="mt-2 flex items-center gap-4">
                <button className="text-xs text-gray-400 transition-colors hover:text-blue-400">
                  Ответить
                </button>
                <button className="text-xs text-gray-400 transition-colors hover:text-blue-400">
                  Нравится
                </button>
              </div>
            </div>
          </div>

          {/* Nested replies would go here */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-12 mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="rounded-lg bg-gray-700/50 p-2">
                  {/* Reply content */}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
