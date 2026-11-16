import type { ReactNode } from "react";

function Svg({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const icons = {
  scale: <Svg><path d="M12 4v16M7 20h10M5 8h14M5 8l-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z" /></Svg>,
  flow: <Svg><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /><path d="M10 6.5h4a3 3 0 0 1 3 3V14" /></Svg>,
  chat: <Svg><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></Svg>,
  blueprint: <Svg><path d="M4 4h16v16H4z" /><path d="M4 9h6v11M10 14h10M15 4v5" /></Svg>,
  truck: <Svg><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></Svg>,
  trophy: <Svg><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 21h6M10 17h4v4h-4z" /></Svg>,
  mail: <Svg><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Svg>,
  whatsapp: <Svg><path d="M20 12a8 8 0 0 1-11.9 7l-4.1 1.1 1.1-4A8 8 0 1 1 20 12z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-1.8-.9-.9.9a4 4 0 0 1-2.3-2.3l.9-.9-.9-1.8z" /></Svg>,
  spark: <Svg><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></Svg>,
  shield: <Svg size={14}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></Svg>,
  trend: <Svg size={14}><path d="M3 17l6-6 4 4 8-8M15 7h6v6" /></Svg>,
  sun: <Svg size={18}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>,
  moon: <Svg size={18}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></Svg>
};
