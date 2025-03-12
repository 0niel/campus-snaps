import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";

const imageCache = new Map<string, string>();

interface ImageWithCacheProps extends Omit<ImageProps, "src"> {
  src: string;
}

export function ImageWithCache({
  src,
  alt,
  onLoadingComplete,
  ...props
}: ImageWithCacheProps) {
  const [optimizedSrc, setOptimizedSrc] = useState<string>(
    imageCache.get(src) || src,
  );

  useEffect(() => {
    if (!imageCache.has(src)) {
      imageCache.set(src, src);
    }
  }, [src]);

  const handleLoadingComplete = (result: {
    naturalWidth: number;
    naturalHeight: number;
  }) => {
    onLoadingComplete?.(result);
  };

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      onLoadingComplete={handleLoadingComplete}
      {...props}
    />
  );
}
