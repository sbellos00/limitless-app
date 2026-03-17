import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { sounds } from "../../utils/sounds";

const BLUR_MAP = {
  xs: "blur-[2px]",
  sm: "blur-sm",
  md: "blur-md",
  lg: "blur-lg",
  xl: "blur-xl",
  "2xl": "blur-2xl",
  "3xl": "blur-[64px]",
};

export const AppleBorderGradient = ({
  preview,
  className = "",
  intensity = "lg",
}) => {
  const blurClass = BLUR_MAP[intensity] || BLUR_MAP.lg;

  return (
    <AnimatePresence>
      {preview && (
        <motion.div
          initial={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          animate={{
            opacity: 1,
            background: [
              "linear-gradient(0deg, rgb(59, 130, 246), rgb(168, 85, 247), rgb(239, 68, 68), rgb(249, 115, 22))",
              "linear-gradient(360deg, rgb(59, 130, 246), rgb(168, 85, 247), rgb(239, 68, 68), rgb(249, 115, 22))",
            ],
          }}
          transition={{
            opacity: { duration: 0.5, ease: "easeInOut" },
            duration: 5,
            repeat: Infinity,
            ease: "linear",
          }}
          className={`absolute size-full after:absolute after:inset-[2px] after:bg-neutral-900 after:${blurClass} after:content-[''] ${className}`}
        />
      )}
    </AnimatePresence>
  );
};

const AppleBorderGradientDemo = () => {
  const [preview, setPreview] = useState(false);

  const handleToggle = () => {
    if (!preview) sounds.tap();
    setPreview((x) => !x);
  };

  return (
    <motion.div className="relative flex h-full w-full">
      <AppleBorderGradient intensity="xl" preview={preview} />

      <div className="absolute left-1/2 top-[30%] grid -translate-x-1/2 content-start justify-items-center gap-6 text-center">
        <span className="relative max-w-[12ch] text-xs uppercase leading-tight text-white/40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-transparent after:to-white after:content-['']">
          Click to see the border gradient
        </span>
      </div>

      <div className="relative z-[2] flex size-full items-center justify-center">
        <button
          onClick={handleToggle}
          className="rounded-2xl bg-neutral-900 px-5 py-2 text-white ring-1 ring-white/10 transition-all duration-300 active:scale-[0.98]"
        >
          Turn {preview ? "On" : "Off"} Apple Intelligence
        </button>
      </div>
    </motion.div>
  );
};

export default AppleBorderGradientDemo;
