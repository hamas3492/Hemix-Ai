"use client";

import React, { useRef, useEffect } from "react";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    if (!value && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const cleanDigit = inputValue.replace(/\D/g, "");

    if (!cleanDigit) {
      const newDigits = [...digits];
      newDigits[index] = "";
      const newValue = newDigits.join("");
      onChange(newValue);
      return;
    }

    if (cleanDigit.length > 1) {
      handlePasteData(cleanDigit, index);
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanDigit.slice(-1);
    const newValue = newDigits.join("");
    onChange(newValue);

    if (index < length - 1 && cleanDigit) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newValue.length === length && !newValue.includes("")) {
      onComplete?.(newValue);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePasteData = (pastedText: string, startIndex: number = 0) => {
    const clean = pastedText.replace(/\D/g, "").slice(0, length);
    if (!clean) return;

    const newDigits = [...digits];
    for (let i = 0; i < clean.length; i++) {
      if (startIndex + i < length) {
        newDigits[startIndex + i] = clean[i];
      }
    }

    const newValue = newDigits.join("");
    onChange(newValue);

    const nextIndex = Math.min(startIndex + clean.length, length - 1);
    inputRefs.current[nextIndex]?.focus();

    if (newValue.length === length) {
      onComplete?.(newValue);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    handlePasteData(pasted, 0);
  };

  return (
    <div className="flex items-center justify-between gap-2 my-2">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[index]}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl transition-all outline-none text-white ${
            hasError
              ? "bg-red-500/10 border-red-500/50 focus:border-red-400 focus:ring-1 focus:ring-red-400"
              : digits[index]
              ? "bg-primary/10 border-primary/50 text-white"
              : "bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/50 hover:border-white/20"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"} border`}
        />
      ))}
    </div>
  );
}
