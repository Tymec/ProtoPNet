import React, { useEffect, useState } from 'react';
import LoadingWheel from './LoadingWheel';

interface HeatmapProps {
  heatmapImages: string[];
}

const UploadImages: React.FC<HeatmapProps> = ({ heatmapImages }) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    if (heatmapImages.length > 0) {
      const loadPromises = heatmapImages.map((src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = `${import.meta.env.VITE_API_URL}/${src}`;
          img.onload = resolve;
          img.onerror = reject;
        });
      });

      Promise.all(loadPromises)
        .then(() => setImagesLoaded(true))
        .catch((err) => console.error("Failed to load images", err));
    }
  }, [heatmapImages]);

  return (
    <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg relative ">
      {!imagesLoaded && <LoadingWheel/>}

      {imagesLoaded && (
        <div className="flex flex-row items-center justify-start flex-wrap gap-4">
          {heatmapImages.map((image, index) => (
            <img
              key={index}
              className="rounded-lg"
              src={`${import.meta.env.VITE_API_URL}/${image}`}
              alt="Heatmap"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadImages;
