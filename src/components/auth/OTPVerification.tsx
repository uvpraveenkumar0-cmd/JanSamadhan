import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, RefreshCw, KeyRound, AlertCircle } from 'lucide-react';

interface OTPVerificationProps {
  destination: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  simulatedCode?: string;
  isLoading?: boolean;
  error?: string;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  destination,
  onVerify,
  onResend,
  simulatedCode,
  isLoading = false,
  error,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, val: string) => {
    // Only accept numeric digit
    const cleaned = val.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const copy = [...digits];
      copy[index] = '';
      setDigits(copy);
      return;
    }

    // Single digit input
    const char = cleaned.slice(-1);
    const copy = [...digits];
    copy[index] = char;
    setDigits(copy);

    // Auto-focus next
    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // If all filled, auto-trigger verify
    const fullCode = copy.join('');
    if (fullCode.length === 6 && !copy.includes('')) {
      onVerify(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasteData) return;

    const copy = [...digits];
    for (let i = 0; i < 6; i++) {
      copy[i] = pasteData[i] || '';
    }
    setDigits(copy);

    const nextIndex = Math.min(pasteData.length, 5);
    inputsRef.current[nextIndex]?.focus();

    if (pasteData.length === 6) {
      onVerify(pasteData);
    }
  };

  const handleQuickFillSimulated = () => {
    if (simulatedCode && simulatedCode.length === 6) {
      const copy = simulatedCode.split('');
      setDigits(copy);
      onVerify(simulatedCode);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isComplete = digits.every((d) => d !== '');

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
          Enter Verification Code
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          We have sent a 6-digit one-time code to{' '}
          <span className="font-medium text-slate-800 dark:text-slate-200">{destination}</span>
        </p>
      </div>

      {/* Simulated Code Banner for Presentation */}
      {simulatedCode && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <KeyRound className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              Demo Security Code: <strong className="font-mono tracking-wider">{simulatedCode}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleQuickFillSimulated}
            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline bg-emerald-100/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded"
          >
            Auto Fill
          </button>
        </div>
      )}

      {/* 6 Digits Box */}
      <div className="flex justify-center gap-2 my-4" onPaste={handlePaste}>
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="w-11 h-12 text-center text-lg font-bold font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 dark:text-white transition-all shadow-sm"
          />
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 justify-center">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Timer & Resend */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
        <span>
          Expires in:{' '}
          <strong className="font-mono text-slate-700 dark:text-slate-300">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </strong>
        </span>

        <button
          type="button"
          onClick={() => {
            setTimeLeft(300);
            onResend();
          }}
          disabled={timeLeft > 240 || isLoading}
          className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium hover:underline disabled:opacity-50 disabled:no-underline"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Resend Code</span>
        </button>
      </div>

      <button
        type="button"
        disabled={!isComplete || isLoading}
        onClick={() => onVerify(digits.join(''))}
        className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-lg shadow-md hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Verifying Code...</span>
          </>
        ) : (
          <span>Verify & Complete</span>
        )}
      </button>
    </div>
  );
};
