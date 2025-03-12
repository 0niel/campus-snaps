"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CodeInputProps {
  length?: number;
  onChange: (code: string) => void;
  value: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

const CodeInput: React.FC<CodeInputProps> = ({
  length = 6,
  onChange,
  value,
  autoFocus = false,
  disabled = false,
}) => {
  const [localValues, setLocalValues] = useState<string[]>(
    Array(length).fill(""),
  );
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const chars = value?.split("").slice(0, length) || [];
    const newLocalValues = Array(length).fill("");
    chars.forEach((char, i) => {
      if (i < length) newLocalValues[i] = char;
    });
    setLocalValues(newLocalValues);
  }, [value, length]);

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, inputValue: string) => {
    if (disabled) return;

    if (!/^\d*$/.test(inputValue)) return;

    const newValues = [...localValues];

    if (inputValue.length > 1) {
      const pastedChars = inputValue
        .split("")
        .filter((c) => /\d/.test(c))
        .slice(0, length);

      for (let i = 0; i < length; i++) {
        newValues[i] = pastedChars[i] || "";
      }

      setLocalValues(newValues);
      onChange(newValues.join(""));

      const lastFilledIndex = pastedChars.length - 1;
      const nextIndex = Math.min(length - 1, Math.max(0, lastFilledIndex));

      if (inputsRef.current[nextIndex]) {
        inputsRef.current[nextIndex].focus();
      }

      return;
    }

    newValues[index] = inputValue;
    setLocalValues(newValues);
    onChange(newValues.join(""));

    if (inputValue && index < length - 1 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      if (!localValues[index] && index > 0 && inputsRef.current[index - 1]) {
        inputsRef.current[index - 1].focus();

        const newValues = [...localValues];
        newValues[index - 1] = "";
        setLocalValues(newValues);
        onChange(newValues.join(""));
      } else if (localValues[index]) {
        const newValues = [...localValues];
        newValues[index] = "";
        setLocalValues(newValues);
        onChange(newValues.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handlePaste = (
    index: number,
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();
    if (disabled) return;

    const pastedData = e.clipboardData.getData("text");
    if (!pastedData) return;

    const pastedNumbers = pastedData.replace(/[^\d]/g, "");
    if (!pastedNumbers) return;

    handleChange(index, pastedNumbers);
  };

  return (
    <div className="flex justify-center space-x-2 md:space-x-3">
      {Array.from({ length }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * index }}
          className="relative"
        >
          <input
            ref={(el) => (inputsRef.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={localValues[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={handleFocus}
            onPaste={(e) => handlePaste(index, e)}
            disabled={disabled}
            className={`h-14 w-10 rounded-md border-0 bg-gray-800 text-center text-xl font-medium text-white shadow-sm ring-1 ring-inset md:h-16 md:w-12 md:text-2xl ${
              disabled
                ? "bg-gray-800/50 text-gray-500 ring-gray-700"
                : "ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-500"
            }`}
            aria-label={`Digit ${index + 1} of verification code`}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default CodeInput;
