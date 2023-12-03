import { useEffect, useState } from 'react';
import { LoadingWheel } from '.';

interface HeatmapProps {
  images: string[];
  overlay: string[];
  uploaded: boolean;
}

export default function ImageDrawer({ images, overlay, uploaded }: HeatmapProps) {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(-1);

  useEffect(() => {
    setImagesLoaded(false);
    if (images.length > 0) {
      const loadPromises = images.map((src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = resolve;
          img.onerror = reject;
        });
      });

      Promise.all(loadPromises)
        .then(() => setImagesLoaded(true))
        .catch((err) => console.error('Failed to load images', err));
    }
  }, [images]);

  return (
    <div className="flex min-h-[400px] flex-row flex-wrap items-center justify-center gap-4 rounded-lg bg-gray-200 p-4 shadow-md shadow-black dark:bg-gray-700">
      {!imagesLoaded && uploaded && (
        <div className="flex h-full w-full items-center justify-center">
          <LoadingWheel />
        </div>
      )}
      {imagesLoaded &&
        images.map((image, index) => (
          <div className="relative" key={index}>
            <img
              className={`rounded-lg object-contain shadow-md shadow-black
              ${hoverIndex === index ? 'z-10 scale-125 !blur-none' : ''}
              ${hoverIndex !== index && hoverIndex !== -1 ? '!blur-sm' : ''} relative`}
              src={image}
              alt="Heatmap"
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(-1)}
            />
            <img
              src={overlay[index]}
              className={`pointer-events-none absolute inset-0 z-20 scale-125 rounded-lg object-contain mix-blend-screen
                ${hoverIndex === index ? 'opacity-100' : 'opacity-0'}`}
              alt="Heatmap Overlay"
            />
          </div>
        ))}
    </div>
  );
}
