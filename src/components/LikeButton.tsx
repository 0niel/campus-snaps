import React, { useState } from "react";
import { motion } from "framer-motion";

type LikeButtonProps = {
  initialLiked: boolean;
  count: number;
  onLike: (liked: boolean) => void;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
};

export function LikeButton({
  initialLiked = false,
  count = 0,
  onLike,
  size = "md",
  showCount = true,
  className = "",
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 700);

    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prevCount) =>
      newLiked ? prevCount + 1 : Math.max(0, prevCount - 1),
    );
    onLike(newLiked);
  };

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const buttonSizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <button
      onClick={handleLike}
      className={`relative flex items-center space-x-1 rounded-full ${
        liked ? "bg-red-600/20" : "bg-gray-800/80"
      } ${buttonSizeClasses[size]} text-white backdrop-blur-sm transition-all hover:bg-gray-700/80 ${className}`}
    >
      <div className="relative">
        {isAnimating && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute -inset-1 rounded-full bg-red-500/40"
          />
        )}

        <motion.svg
          animate={liked ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.4 }}
          className={`${sizeClasses[size]} ${liked ? "fill-red-500 text-red-500" : "text-white"}`}
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </motion.svg>
      </div>

      {showCount && <span>{likeCount > 0 ? likeCount : "Нравится"}</span>}
    </button>
  );
}
