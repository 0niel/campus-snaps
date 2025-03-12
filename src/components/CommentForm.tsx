import React, { useState, useRef, type RefObject } from "react";
import { useSession } from "next-auth/react";
import { ImageWithCache } from "~/components/ImageWithCache";

interface CommentFormProps {
  photoId: number;
  inputRef?: RefObject<HTMLTextAreaElement>;
  onCommentAdded: (comment: any) => void;
  placeholder?: string;
  replyTo?: number;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  photoId,
  inputRef,
  onCommentAdded,
  placeholder = "Добавить комментарий...",
  replyTo,
}) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const localInputRef = useRef<HTMLTextAreaElement>(null);
  const { data: session } = useSession();
  const user = session?.user;

  const textareaRef = inputRef || localInputRef;

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setComment(textarea.value);

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const mockComment = {
        id: Math.random().toString(36).substr(2, 9),
        text: comment,
        createdAt: new Date().toISOString(),
        user: {
          id: user?.id || "anonymous",
          name: user?.name || null,
          email: user?.email || null,
          image: user?.image || null,
        },
        photoId,
      };

      setComment("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      onCommentAdded(mockComment);
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex gap-3">
        {user?.image ? (
          <ImageWithCache
            src={user.image}
            alt={user.name || user.email || ""}
            width={36}
            height={36}
            className="h-9 w-9 flex-shrink-0 rounded-full"
          />
        ) : (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
            {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={handleInput}
            className="max-h-[120px] min-h-[40px] w-full resize-none overflow-hidden rounded-lg bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={placeholder}
            rows={1}
          />

          <div className="mt-2 flex items-center justify-between">
            {/* Emoji picker button - could be implemented later */}
            <button
              type="button"
              className="text-gray-400 transition-colors hover:text-gray-300"
              title="Добавить эмодзи"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            <button
              type="submit"
              disabled={!comment.trim() || isSubmitting}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                !comment.trim() || isSubmitting
                  ? "cursor-not-allowed bg-gray-700 text-gray-400"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Отправка..." : "Отправить"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
