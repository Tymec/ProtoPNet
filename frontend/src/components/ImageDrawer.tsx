import { useEffect, useState } from 'react';
import LoadingWheel from './LoadingWheel';

interface HeatmapProps {
  images: string[];
  overlay: string[];
}

export default function ImageDrawer({ images, overlay }: HeatmapProps) {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(-1);

  // TODO: Apply overlay on hover with 'mix-blend-mode: screen'

  useEffect(() => {
    setImagesLoaded(false);
    if (images.length > 0) {
      const loadPromises = images.map((src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = `${import.meta.env.VITE_API_URL}/${src}`;
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
    <div className={`rounded-lg bg-gray-200 p-4 shadow-md shadow-black dark:bg-gray-700`}>
      {!imagesLoaded && <LoadingWheel />}
      {imagesLoaded && (
        <div className="flex flex-row flex-wrap items-center justify-center gap-4">
          {images.map((image, index) => (
            <div className="relative" key={index}>
              <img
                className={`rounded-lg object-contain shadow-md shadow-black
              ${hoverIndex === index ? 'z-10 scale-125 !blur-none' : ''}
              ${hoverIndex !== index && hoverIndex !== -1 ? '!blur-sm' : ''}`}
                src={`${import.meta.env.VITE_API_URL}/${image}`}
                alt="Heatmap"
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(-1)}
              />
              <img
                src={`${import.meta.env.VITE_API_URL}/${overlay[index]}`}
                className={`pointer-events-none absolute inset-0 z-20 scale-125 rounded-lg object-contain mix-blend-screen
                ${hoverIndex === index ? 'opacity-100' : 'opacity-0'}`}
                alt="Heatmap Overlay"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
