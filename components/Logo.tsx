import React from 'react';

export function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { main: "text-sm", sub: "text-[7px]", my: "text-base" },
    md: { main: "text-base", sub: "text-[8px]", my: "text-lg" },
    lg: { main: "text-xl", sub: "text-[10px]", my: "text-2xl" },
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex flex-col items-start leading-none ${className}`}>
      <div className={`flex items-center gap-1 ${currentSize.main} font-medium tracking-tight text-gray-900 dark:text-white`}>
        <span>Ease</span>
        <span className={`font-serif italic font-black text-primary ${currentSize.my} px-0.5 transform -rotate-3`}>
          my
        </span>
        <span>access</span>
      </div>
      <div className={`flex items-center gap-1 mt-0.5 ${currentSize.sub} font-bold tracking-widest text-muted-foreground uppercase opacity-60`}>
        <span>powered by</span>
        <span className="text-primary/80">TechfluenX</span>
      </div>
    </div>
  );
}
