"use client";

import { useEffect, useRef, useState } from "react";
import { img } from "@/lib/pricing";
import type { Metal, Stone } from "@/lib/types";
import JewelArt from "./JewelArt";

/** Image with a shimmer while loading and a drawn illustration if the photo can't load. */
export default function Photo({
  src, alt, w = 800, className = "", imgClassName = "", imgStyle, fallback, eager = false,
}: {
  src?: string; alt: string; w?: number; className?: string; imgClassName?: string; eager?: boolean; imgStyle?: React.CSSProperties;
  fallback?: { kind: string; metal: Metal; stone: Stone };
}) {
  const [state, setState] = useState<"loading" | "ok" | "error">(src ? "loading" : "error");
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    setState(src ? "loading" : "error");
    // The image may have finished loading before React hydrated and attached onLoad.
    const el = ref.current;
    if (el?.complete) setState(el.naturalWidth > 0 ? "ok" : "error");
  }, [src]);
  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative "}overflow-hidden ${className}`}>
      {state === "loading" && <div className="skeleton absolute inset-0" />}
      {state === "error" ? (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_35%,#fff8ea,#f3e6cf)]">
          <JewelArt kind={fallback?.kind ?? "pendant"} metal={fallback?.metal ?? "yellow"} stone={fallback?.stone ?? "none"} className="h-3/4 w-3/4" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={img(src!, w)}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setState("ok")}
          onError={() => setState("error")}
          style={imgStyle}
          className={`h-full w-full object-cover transition-opacity duration-700 ${state === "ok" ? "opacity-100" : "opacity-0"} ${imgClassName}`}
        />
      )}
    </div>
  );
}
