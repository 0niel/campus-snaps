import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface WelcomeBannerProps {
  onUploadClick: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  onUploadClick,
}) => {
  return (
    <div className="relative mb-12 overflow-hidden rounded-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-purple-900/80 mix-blend-multiply"></div>
      <div className="relative z-10 flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-8 flex items-center justify-center">
          <span className="text-4xl font-bold tracking-tight">
            Campus<span className="text-blue-400">Snaps</span>
          </span>
        </div>
        <h1 className="mb-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Фотоархив университета
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-blue-100">
          Исследуйте и делитесь яркими моментами университетской жизни
        </p>
        <div className="flex flex-wrap gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUploadClick}
            className="flex items-center rounded-full bg-blue-500 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-600"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"
              />
            </svg>
            Загрузить фото
          </motion.button>
        </div>
      </div>
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://picsum.photos/1920/600?campus"
          alt="Кампус университета"
          fill
          priority
          className="object-cover opacity-40"
        />
      </div>
    </div>
  );
};
