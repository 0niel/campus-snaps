"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";

type HeaderProps = {
  onUploadClick: () => void;
  onCalendarToggle?: () => void;
  showCalendar?: boolean;
};

export function Header({
  onUploadClick,
  onCalendarToggle,
  showCalendar = false,
}: HeaderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === "authenticated";

  console.log("Header session:", { session, status });

  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuRef]);

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/auth/signin");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleSignIn = () => {
    router.push("/auth/signin");
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/80 shadow-lg backdrop-blur-md" : "bg-black"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <svg
              className="mr-2 h-8 w-8 text-blue-500"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 9C3 7.89543 3.89543 7 5 7H7.72525C8.46646 7 9.10464 6.61556 9.41141 6.03329L10.2236 4.41006C10.5304 3.82779 11.1686 3.44335 11.9098 3.44335H12.0902C12.8314 3.44335 13.4696 3.82779 13.7764 4.41006L14.5886 6.03329C14.8954 6.61556 15.5335 7 16.2748 7H19C20.1046 7 21 7.89543 21 9V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V9Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle
                cx="12"
                cy="13"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span className="text-lg font-bold tracking-tight text-white">
              Campus<span className="text-blue-400">Snaps</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center md:flex">
          <Link
            href="/"
            className="mx-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Главная
          </Link>
          <Link
            href="/events"
            className="mx-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Мероприятия
          </Link>
          <Link
            href="/groups"
            className="mx-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Учебные группы
          </Link>
          <Link
            href="/explore"
            className="mx-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Обзор
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* Calendar button */}
          {onCalendarToggle && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCalendarToggle}
              className={`flex items-center rounded-full p-2 transition-colors ${
                showCalendar
                  ? "bg-blue-500 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
              title="Календарь событий"
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
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </motion.button>
          )}

          {/* Upload button (only if authenticated) */}
          {isAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onUploadClick}
              className="flex items-center rounded-full bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600"
              title="Загрузить фото"
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
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"
                />
              </svg>
            </motion.button>
          )}

          {/* User avatar or sign in button */}
          {isAuthenticated ? (
            <div className="relative ml-2" ref={userMenuRef}>
              <button
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-800 transition-transform hover:ring-2 hover:ring-blue-400"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                title={session?.user?.name || "Профиль"}
              >
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session?.user?.name || "Профиль"}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-blue-600 text-white">
                    {session?.user?.name
                      ? session.user.name.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                )}
              </button>

              {/* User dropdown menu */}
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 rounded-lg bg-gray-900 py-1 shadow-lg ring-1 ring-gray-800"
                >
                  <div className="border-b border-gray-800 px-4 py-2">
                    <p className="text-sm font-medium text-white">
                      {session?.user?.name || "Пользователь"}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {session?.user?.email || ""}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                    >
                      Мой профиль
                    </Link>
                    <Link
                      href="/albums"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                    >
                      Мои альбомы
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                    >
                      Настройки
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800"
                    >
                      Выйти
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignIn}
              className="rounded-full bg-blue-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              Войти
            </motion.button>
          )}

          {/* Mobile menu button */}
          <button
            className="rounded-lg p-1 text-gray-300 hover:bg-gray-800 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isMobileMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16m-7 6h7"
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-gray-800 bg-gray-900 px-4 py-2 md:hidden"
        >
          <Link href="/" className="block py-2 text-white">
            Главная
          </Link>
          <Link href="/events" className="block py-2 text-white">
            Мероприятия
          </Link>
          <Link href="/groups" className="block py-2 text-white">
            Учебные группы
          </Link>
          <Link href="/explore" className="block py-2 text-white">
            Обзор
          </Link>
          {!isAuthenticated && (
            <Link
              href="/auth/signin"
              className="mt-2 block rounded-lg bg-blue-500 px-4 py-2 text-center text-white"
            >
              Войти
            </Link>
          )}
        </motion.div>
      )}
    </header>
  );
}
