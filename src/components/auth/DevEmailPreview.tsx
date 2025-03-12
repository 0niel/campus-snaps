"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface DevEmailPreviewProps {
  email: string;
}

export default function DevEmailPreview({ email }: DevEmailPreviewProps) {
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email || process.env.NODE_ENV === "production") return;

    const fetchCode = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/dev/auth-code?email=${encodeURIComponent(email)}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch verification code");
        }

        const data = await response.json();
        if (data.code) {
          setVerificationCode(data.code);
        } else {
          setError("No verification code found");
        }
      } catch (err) {
        console.error("Error fetching verification code:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchCode();
  }, [email]);

  if (process.env.NODE_ENV === "production") return null;
  if (!email) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-6 rounded-md border border-yellow-700/30 bg-yellow-900/20 p-4"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-300">
            Development Mode
          </h3>
          <div className="mt-2 text-sm text-yellow-200">
            {loading ? (
              <p className="flex items-center">
                <svg
                  className="-ml-1 mr-2 h-4 w-4 animate-spin text-yellow-300"
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
                Fetching verification code...
              </p>
            ) : error ? (
              <p className="text-red-300">Error: {error}</p>
            ) : verificationCode ? (
              <div>
                <p>
                  Email may not be sent in development mode. Use this
                  verification code:
                </p>
                <div className="mt-2 rounded-md bg-gray-800/50 px-3 py-2 text-center font-mono text-xl tracking-wide">
                  {verificationCode}
                </div>
              </div>
            ) : (
              <p>No verification code available</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
