'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

// Loading fallback component
interface LoadingFallbackProps {
  message?: string;
  className?: string;
}

export function LoadingFallback({ 
  message = 'Loading...', 
  className = '' 
}: LoadingFallbackProps) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="flex items-center space-x-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-gray-600">{message}</span>
      </div>
    </div>
  );
}

// Enhanced lazy loading HOC
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ComponentType,
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>
) {
  const LazyComponent = lazy(importFn);
  
  return React.forwardRef<any, P>((props, ref) => {
    const FallbackComponent = fallback || LoadingFallback;
    
    return (
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    );
  });
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasBeenVisible, setHasBeenVisible] = React.useState(false);

  React.useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [elementRef, options, hasBeenVisible]);

  return { isIntersecting, hasBeenVisible };
}

// Lazy loaded image component
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  errorComponent?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export function LazyImage({
  src,
  alt = '',
  fallbackSrc,
  placeholder,
  errorComponent,
  rootMargin = '50px',
  threshold = 0.1,
  className = '',
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [currentSrc, setCurrentSrc] = React.useState<string | null>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  
  const { isIntersecting, hasBeenVisible } = useIntersectionObserver(imgRef, {
    rootMargin,
    threshold,
  });

  React.useEffect(() => {
    if (hasBeenVisible && !currentSrc) {
      setCurrentSrc(src);
    }
  }, [hasBeenVisible, src, currentSrc]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
    onError?.(e);
  };

  if (hasError && !fallbackSrc) {
    return (
      <div ref={imgRef} className={`bg-gray-200 flex items-center justify-center ${className}`}>
        {errorComponent || (
          <span className="text-gray-500 text-sm">Failed to load image</span>
        )}
      </div>
    );
  }

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {currentSrc && (
        <img
          {...props}
          src={currentSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {(!isLoaded || !currentSrc) && (
        <div className={`absolute inset-0 bg-gray-200 flex items-center justify-center ${className}`}>
          {placeholder || (
            <div className="animate-pulse bg-gray-300 w-full h-full" />
          )}
        </div>
      )}
    </div>
  );
}

// Lazy loaded section component
interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  rootMargin?: string;
  threshold?: number;
}

export function LazySection({
  children,
  fallback,
  className = '',
  rootMargin = '100px',
  threshold = 0.1,
}: LazySectionProps) {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const { hasBeenVisible } = useIntersectionObserver(sectionRef, {
    rootMargin,
    threshold,
  });

  return (
    <div ref={sectionRef} className={className}>
      {hasBeenVisible ? children : (fallback || <LoadingFallback />)}
    </div>
  );
}

// Lazy loaded list component for virtualization
interface LazyListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
}

export function LazyList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5,
  className = '',
}: LazyListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) =>
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
}

// Preload component for critical resources
interface PreloadProps {
  href: string;
  as: 'script' | 'style' | 'image' | 'font';
  type?: string;
  crossOrigin?: string;
}

export function Preload({ href, as, type, crossOrigin }: PreloadProps) {
  React.useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    if (crossOrigin) link.crossOrigin = crossOrigin;
    
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, [href, as, type, crossOrigin]);

  return null;
}