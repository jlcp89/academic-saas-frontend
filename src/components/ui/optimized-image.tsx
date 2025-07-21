'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { LazyImage, useIntersectionObserver } from './lazy-loading';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  loading?: 'lazy' | 'eager';
  unoptimized?: boolean;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  fallbackSrc?: string;
  enableLazyLoading?: boolean;
  enableProgressiveLoading?: boolean;
  enableWebP?: boolean;
  generatePlaceholder?: boolean;
}

// Generate a blur data URL for placeholder
function generateBlurDataURL(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create a simple gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
}

// Check if WebP is supported
function checkWebPSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    const webP = document.createElement('img') as HTMLImageElement;
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

// Convert image URL to WebP if supported
function getOptimizedImageSrc(src: string, supportsWebP: boolean): string {
  if (!supportsWebP) return src;
  
  // Check if the image is already optimized or is a data URL
  if (src.startsWith('data:') || src.includes('.webp')) {
    return src;
  }
  
  // For external URLs, you might want to use a service like Cloudinary or Imgix
  // For now, we'll just return the original URL
  return src;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  className = '',
  style,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  loading = 'lazy',
  unoptimized = false,
  onLoad,
  onError,
  fallbackSrc,
  enableLazyLoading = true,
  enableProgressiveLoading = true,
  enableWebP = true,
  generatePlaceholder = true,
  ...props
}: OptimizedImageProps) {
  const [supportsWebP, setSupportsWebP] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [placeholderDataURL, setPlaceholderDataURL] = useState(blurDataURL);
  
  const imgRef = useRef<HTMLDivElement>(null);
  const { hasBeenVisible } = useIntersectionObserver(imgRef as React.RefObject<Element>, {
    rootMargin: '50px',
    threshold: 0.1,
  });

  // Check WebP support on mount
  useEffect(() => {
    if (enableWebP) {
      checkWebPSupport().then(setSupportsWebP);
    }
  }, [enableWebP]);

  // Generate placeholder if needed
  useEffect(() => {
    if (generatePlaceholder && !blurDataURL && width && height) {
      const placeholder = generateBlurDataURL(Math.min(width, 40), Math.min(height, 40));
      setPlaceholderDataURL(placeholder);
    }
  }, [generatePlaceholder, blurDataURL, width, height]);

  // Update src when WebP support is determined
  useEffect(() => {
    if (enableWebP && supportsWebP !== null) {
      setCurrentSrc(getOptimizedImageSrc(src, supportsWebP));
    }
  }, [src, supportsWebP, enableWebP]);

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(event);
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    
    onError?.(event);
  };

  // Use lazy loading if enabled and not priority
  const shouldUseLazyLoading = enableLazyLoading && !priority && loading === 'lazy';

  // Progressive loading implementation
  const progressiveLoadingProps = enableProgressiveLoading ? {
    placeholder: placeholder === 'blur' && placeholderDataURL ? 'blur' as const : 'empty' as const,
    blurDataURL: placeholderDataURL,
  } : {};

  // If using custom lazy loading
  if (shouldUseLazyLoading) {
    return (
      <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={style}>
        {hasBeenVisible ? (
          <LazyImage
            src={currentSrc}
            alt={alt}
            className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} w-full h-full object-${objectFit}`}
            style={{ objectPosition }}
            onLoad={handleLoad}
            onError={handleError}
            fallbackSrc={fallbackSrc}
            {...props}
          />
        ) : (
          <div className={`bg-gray-200 w-full h-full flex items-center justify-center ${className}`}>
            {placeholderDataURL ? (
              <img 
                src={placeholderDataURL} 
                alt="" 
                className="w-full h-full object-cover blur-sm"
              />
            ) : (
              <div className="animate-pulse bg-gray-300 w-full h-full" />
            )}
          </div>
        )}
      </div>
    );
  }

  // Use Next.js Image component for optimization
  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={style}>
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        quality={quality}
        loading={loading}
        unoptimized={unoptimized}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          objectFit, 
          objectPosition,
          ...style 
        }}
        onLoad={handleLoad}
        onError={handleError}
        {...progressiveLoadingProps}
        {...props}
      />
      
      {/* Error fallback */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Image not available</span>
        </div>
      )}
    </div>
  );
}

// Avatar component with optimized image
interface OptimizedAvatarProps {
  src?: string;
  alt: string;
  size?: number;
  fallbackText?: string;
  className?: string;
  priority?: boolean;
}

export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  fallbackText,
  className = '',
  priority = false,
}: OptimizedAvatarProps) {
  const [hasError, setHasError] = useState(false);
  
  const initials = fallbackText || alt.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (!src || hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-blue-600 text-white font-medium rounded-full ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      priority={priority}
      objectFit="cover"
      onError={() => setHasError(true)}
      generatePlaceholder={true}
      enableProgressiveLoading={true}
    />
  );
}

// Image gallery component with optimization
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  columns?: number;
  gap?: number;
  className?: string;
}

export function OptimizedImageGallery({
  images,
  columns = 3,
  gap = 16,
  className = '',
}: ImageGalleryProps) {
  return (
    <div 
      className={`grid ${className}`}
      style={{ 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {images.map((image, index) => (
        <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            fill={true}
            sizes={`(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${100 / columns}vw`}
            className="hover:scale-105 transition-transform duration-300"
            enableLazyLoading={true}
            enableProgressiveLoading={true}
            generatePlaceholder={true}
          />
          {image.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-sm p-2">
              {image.caption}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}