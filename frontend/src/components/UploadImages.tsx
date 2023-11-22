import React, { useEffect, useState } from 'react';
import LoadingWheel from './LoadingWheel';

interface HeatmapProps {
  images: string[];
}

const ImageDrawer: React.FC<HeatmapProps> = ({ images }) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);

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
    <div
      className={`bg-gray-200 g-gray-200 dark:bg-gray-700 p-4 rounded-lg relative ${
        imagesLoaded ? '' : 'opacity-50'
      }`}
    >
      {!imagesLoaded && <LoadingWheel />}

      {imagesLoaded && (
        <div className="flex flex-row items-center justify-center flex-wrap gap-4 group">
          {images.map((image, index) => (
            <img
              key={index}
              className="hover:shadow-lg hover:shadow-black hover:z-10 hover:scale-125 hover:!blur-none group-hover:blur-sm hover:ease-out hover:transition-transform hover:duration-100 rounded-lg"
              src={`${import.meta.env.VITE_API_URL}/${image}`}
              alt="Heatmap"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageDrawer;
