import { IconFlag } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import LoadingWheel from './LoadingWheel';

interface HeatmapProps {
  images: string[];
  overlay: string[];
  uploaded: boolean;
  sendFeedback: (selectedImages: number[]) => void;
}

export default function ImageDrawer({ images, overlay, uploaded, sendFeedback }: HeatmapProps) {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);

  const selectImage = (index: number) => {
    if (selectedImages.includes(index)) {
      setSelectedImages(selectedImages.filter((i) => i !== index));
    } else {
      setSelectedImages([...selectedImages, index]);
    }
  };

  const onFeedback = () => {
    sendFeedback(selectedImages);
    setSelectedImages([]);
  };

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
    <div
      className={`relative flex min-h-[400px] flex-row flex-wrap items-center justify-center gap-4 rounded-lg bg-gray-200 p-4 py-10 shadow-md shadow-black dark:bg-gray-700 ${
        uploaded ? 'animate-pulse cursor-wait' : 'cursor-default'
      }`}
    >
      <label
        className={`absolute right-0 top-0 flex w-fit p-2 transition-opacity duration-500 ease-in-out ${
          selectedImages.length === 0 ? 'hover:opacity-100' : 'hover:opacity-60'
        }`}
      >
        <input
          type="checkbox"
          aria-label="Flag selected images as incorrect"
          className="peer absolute appearance-none"
          onChange={() => onFeedback()}
          disabled={selectedImages.length === 0}
        />
        <IconFlag
          className={`${selectedImages.length === 0 ? 'text-gray-400 opacity-50' : 'text-red-600'}`}
        />
      </label>

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
              ${hoverIndex !== index && hoverIndex !== -1 ? '!blur-sm' : ''} relative
              ${
                selectedImages.includes(index)
                  ? 'border-2 border-red-500'
                  : 'border-2 border-transparent'
              }`}
              src={image}
              alt="Heatmap"
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(-1)}
              onClick={() => selectImage(index)}
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
