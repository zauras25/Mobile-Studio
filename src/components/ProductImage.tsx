"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

export default function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: Props) {
  const [unavailableSrc, setUnavailableSrc] = useState<string | null>(null);

  if (!src || unavailableSrc === src) {
    return (
      <div
        role="img"
        aria-label={`${alt} image unavailable`}
        className="product-image-fallback"
      >
        <span aria-hidden="true" className="product-image-fallback-mark">◇</span>
        <span className="product-image-fallback-label">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
      onError={() => setUnavailableSrc(src)}
    />
  );
}
