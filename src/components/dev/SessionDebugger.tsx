"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function SessionDebugger() {
  const { data: session, status, update } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <motion.div
        initial={{ opacity: 0.7 }}
        whileHover={{ opacity: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer rounded-full border border-gray-700 bg-gray-900 px-3 py-1 text-xs text-white"
      >
        🔑 {status}
      </motion.div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 max-h-64 max-w-sm overflow-auto rounded-lg border border-gray-700 bg-gray-900 p-3 font-mono text-xs text-gray-300"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="font-bold text-white">Session State</span>
            <button
              onClick={() => update()}
              className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
            >
              Refresh
            </button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify({ session, status }, null, 2)}
          </pre>
        </motion.div>
      )}
    </div>
  );
}
