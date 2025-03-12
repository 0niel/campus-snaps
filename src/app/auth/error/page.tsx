"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const router = useRouter();
  const [countdown, setCountdown] = useState(15);

  const extractErrorMessage = (error: string | null) => {
    if (!error) return null;

    const waitMatch = error.match(/подождите (\d+) секунд/);
    if (waitMatch && waitMatch[1]) {
      const seconds = parseInt(waitMatch[1]);
      return {
        message: `Слишком частые запросы. Пожалуйста, подождите ${seconds} секунд перед следующей попыткой.`,
        countdown: Math.min(seconds, 60),
      };
    }

    return null;
  };

  const extractedError = extractErrorMessage(error);
  const [cooldownCountdown, setCooldownCountdown] = useState(
    extractedError?.countdown || 0,
  );

  useEffect(() => {
    if (cooldownCountdown > 0) {
      const timer = setTimeout(
        () => setCooldownCountdown(cooldownCountdown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [cooldownCountdown]);

  useEffect(() => {
    if (countdown > 0 && cooldownCountdown === 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && cooldownCountdown === 0) {
      router.push("/auth/signin");
    }
  }, [countdown, cooldownCountdown, router]);

  const getErrorMessage = () => {
    if (extractedError) {
      return extractedError.message;
    }

    switch (error) {
      case "Configuration":
        return "Возникла проблема с конфигурацией сервиса. Пожалуйста, попробуйте позже.";
      case "AccessDenied":
        return "Доступ запрещен. У вас нет прав для входа на этот сайт.";
      case "Verification":
        return "Ссылка подтверждения недействительна или истекла. Пожалуйста, запросите новую.";
      case "EmailCreateAccount":
        return "Не удалось создать учетную запись с этим адресом электронной почты.";
      case "EmailSignin":
        return "Не удалось отправить письмо с кодом подтверждения. Попробуйте позже.";
      case "OAuthCallback":
        return "Проблема с авторизацией через внешний сервис.";
      default:
        if (typeof error === "string" && error.includes("мира")) {
          return "Только домены @mirea.ru и @edu.mirea.ru разрешены для регистрации";
        }
        return "Произошла непредвиденная ошибка. Пожалуйста, попробуйте еще раз.";
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <div className="flex flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-3xl font-bold tracking-tight text-white">
                Campus<span className="text-blue-400">Snaps</span>
              </span>
            </Link>
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-white">
            Ошибка авторизации
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-gray-800 bg-gray-900 px-6 py-8 shadow-lg sm:px-10"
          >
            <div className="mb-6 flex justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
                className="rounded-full bg-red-900/50 p-3"
              >
                <svg
                  className="h-8 w-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </motion.div>
            </div>

            <div className="space-y-2 text-center">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-red-300"
              >
                {getErrorMessage()}
              </motion.p>

              {cooldownCountdown > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="mb-4 text-sm text-gray-500">
                    Повторная попытка через:{" "}
                    <span className="font-medium text-blue-400">
                      {cooldownCountdown}
                    </span>{" "}
                    сек
                  </p>
                  <div className="h-2.5 w-full rounded-full bg-gray-800">
                    <div
                      className="h-2.5 rounded-full bg-blue-600 transition-all duration-1000"
                      style={{
                        width: `${(cooldownCountdown / extractedError!.countdown!) * 100}%`,
                      }}
                    ></div>
                  </div>
                </motion.div>
              ) : (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-gray-500"
                >
                  Перенаправление на страницу входа через {countdown} секунд
                </motion.p>
              )}
            </div>

            <div className="mt-8 flex justify-center">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  Вернуться на страницу входа
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
