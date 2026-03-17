'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageSliderProps {
  screenshots: string[];
  alt: string;
}

export default function ImageSlider({ screenshots, alt }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0) {
        setCurrentIndex(screenshots.length - 1);
      } else if (index >= screenshots.length) {
        setCurrentIndex(0);
      } else {
        setCurrentIndex(index);
      }
    },
    [screenshots.length],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goTo(currentIndex + 1);
      } else {
        goTo(currentIndex - 1);
      }
    }
  }, [currentIndex, goTo]);

  if (screenshots.length === 0) return null;

  return (
    <div className="relative">
      {/* Image container */}
      <div
        className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-100"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={screenshots[currentIndex]}
          alt={`${alt} 스크린샷 ${currentIndex + 1}`}
          fill
          className="object-contain"
          sizes="(max-width: 672px) 100vw, 600px"
        />
      </div>

      {/* Arrow buttons */}
      {screenshots.length > 1 && (
        <>
          <button
            onClick={() => goTo(currentIndex - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
            aria-label="이전 스크린샷"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => goTo(currentIndex + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
            aria-label="다음 스크린샷"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Indicator dots */}
      {screenshots.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {screenshots.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                index === currentIndex ? 'bg-neutral-800' : 'bg-gray-300'
              }`}
              aria-label={`스크린샷 ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
