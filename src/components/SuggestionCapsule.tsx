import React from 'react';
import { motion } from 'framer-motion';

interface SuggestionCapsuleProps {
  text: string;
  isEmoji?: boolean;
  shortcut?: string;
  onClick: () => void;
  index: number;
}

export const SuggestionCapsule: React.FC<SuggestionCapsuleProps> = ({
  text,
  isEmoji = false,
  shortcut,
  onClick,
  index
}) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        delay: index * 0.03 
      }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 0 12px var(--accent-glow)"
      }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-overlay bg-overlay/30 backdrop-blur-md text-primary cursor-pointer font-medium text-xs select-none transition-colors duration-200 hover:bg-overlay/50 hover:border-accent hover:text-accent shadow-sm"
    >
      <span className={isEmoji ? "text-sm" : "text-xs font-semibold tracking-wide"}>
        {text}
      </span>
      {shortcut && (
        <span className="flex items-center justify-center px-1.5 py-0.5 rounded bg-primary/10 text-secondary text-[9px] font-bold uppercase tracking-wider scale-90 border border-primary/5">
          {shortcut}
        </span>
      )}
    </motion.button>
  );
};
