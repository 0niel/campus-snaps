"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import CodeInput from "~/components/ui/code-input";

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  const errorMessage = searchParams.get("error") || "";

  const [emailInput, setEmailInput] = useState(email);
  const [verificationCode, setVerificationCode] = useState(token);
  const [showCodeInput, setShowCodeInput] = useState(!!token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(errorMessage);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (errorMessage && errorMessage.includes("подождите")) {
      const match = errorMessage.match(/подождите (\d+) секунд/);
      if (match?.[1]) {
        const seconds = parseInt(match[1]);
        setCountdown(Math.min(seconds, 60));
      }
    }
  }, [errorMessage]);

  useEffect(() => {
    if (email && token) {
      console.log(`Auto-signing in with email: ${email} and token: ${token}`);
      handleVerifyCode();
    }
  }, [email, token]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateEmail = (email: string) => {
    if (process.env.NODE_ENV === "development") {
      return !!email.includes("@");
    } else {
      const regex = /^[^\s@]+@(mirea\.ru|edu\.mirea\.ru)$/i;
      return regex.test(email);
    }
  };

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");

    if (!validateEmail(emailInput)) {
      setError("Разрешены только почты домена @mirea.ru или @edu.mirea.ru");
      return;
    }

    setLoading(true);

    try {
      console.log(`Sending verification code to ${emailInput}`);

      const result = await signIn("email", {
        email: emailInput,
        redirect: false,
        callbackUrl,
      });

      console.log("Send code result:", result);

      if (result?.error) {
        if (result.error.includes("подождите")) {
          const match = result.error.match(/подождите (\d+) секунд/);
          if (match?.[1]) {
            const seconds = parseInt(match[1]);
            setCountdown(Math.min(seconds, 60));
          }
        }
        setError(result.error);
      } else {
        setShowCodeInput(true);
        setVerificationCode("");
        setCountdown(60);
      }
    } catch (error: any) {
      console.error("Send code error:", error);
      setError(
        error?.message ||
          "Произошла ошибка при отправке кода. Пожалуйста, попробуйте снова.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");

    const codeToVerify = verificationCode || token;
    const emailToVerify = emailInput || email;

    if (!codeToVerify || codeToVerify.length !== 6) {
      setError("Пожалуйста, введите 6-значный код");
      return;
    }

    setLoading(true);

    try {
      console.log(
        `Signing in with email: ${emailToVerify}, token: ${codeToVerify}`,
      );

      const callbackWithToken = `/api/auth/callback/email?callbackUrl=${encodeURIComponent(callbackUrl)}&token=${codeToVerify}&email=${encodeURIComponent(emailToVerify)}`;

      console.log(`Direct auth with URL: ${callbackWithToken}`);

      window.location.href = callbackWithToken;
      return;
    } catch (error: any) {
      console.error("Verify code error:", error);
      setError(
        error?.message ||
          "Произошла ошибка при проверке кода. Пожалуйста, попробуйте снова.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    setShowCodeInput(false);
    setVerificationCode("");
    setError("");
    emailInputRef.current?.focus();
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
            {showCodeInput ? "Введите код подтверждения" : "Войти в аккаунт"}
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div
            key={showCodeInput ? "code" : "email"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-gray-800 bg-gray-900 px-6 py-8 shadow-lg sm:px-10"
          >
            {showCodeInput ? (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                  <label
                    htmlFor="verification-code"
                    className="mb-4 block text-sm font-medium leading-6 text-gray-200"
                  >
                    Код подтверждения
                  </label>

                  <div className="flex justify-center">
                    <CodeInput
                      length={6}
                      value={verificationCode}
                      onChange={setVerificationCode}
                      autoFocus
                      disabled={loading}
                    />
                  </div>

                  <p className="mt-4 text-center text-sm text-gray-400">
                    Код отправлен на адрес{" "}
                    <span className="font-medium text-blue-400">
                      {emailInput || email}
                    </span>
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-md bg-red-900/50 p-4"
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-300">
                          {error}
                        </h3>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:bg-blue-800 disabled:text-blue-100"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg
                          className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Проверка...
                      </div>
                    ) : (
                      "Подтвердить"
                    )}
                  </motion.button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    disabled={countdown > 0}
                    onClick={handleResendCode}
                    className="text-sm font-medium text-blue-400 transition-colors hover:text-blue-300 disabled:text-gray-600"
                  >
                    {countdown > 0
                      ? `Отправить новый код через ${countdown}с`
                      : "Отправить новый код"}
                  </button>
                </div>

                {/* Remove the dev email preview reference */}
              </form>
            ) : (
              <form onSubmit={handleSendCode} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-6 text-gray-200"
                  >
                    Email адрес
                  </label>
                  <div className="mt-2">
                    <input
                      ref={emailInputRef}
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="example@mirea.ru"
                      className="block w-full rounded-md border-0 bg-gray-800 px-3 py-2 text-white shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Только адреса @mirea.ru и @edu.mirea.ru
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-md bg-red-900/50 p-4"
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-300">
                          {error}
                        </h3>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:bg-blue-800 disabled:text-blue-100"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg
                          className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Отправка...
                      </div>
                    ) : (
                      "Отправить код"
                    )}
                  </motion.button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                Регистрируясь, вы соглашаетесь с{" "}
                <Link
                  href="/terms"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  правилами использования
                </Link>{" "}
                сервиса
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
