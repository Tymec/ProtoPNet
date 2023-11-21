import React, { useEffect, useState } from 'react';
import LoadingWheel from './LoadingWheel';

interface HeatmapProps {
  images: string[];
}

const UploadImages: React.FC<HeatmapProps> = ({ images }) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
        .catch((err) => console.error("Failed to load images", err));
    }
  }, [images]);

  const handleImageHover = (index: number) => {
    setHoveredIndex(index);
  };

  const handleImageLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className={`bg-gray-200 g-gray-200 dark:bg-gray-700 p-4 rounded-lg relative ${imagesLoaded ? '' : 'opacity-50'}`}>
      {!imagesLoaded && <LoadingWheel />}

      {imagesLoaded && (
        <div className="flex flex-row items-center justify-center flex-wrap gap-4">
          {images.map((image, index) => (
            <img
              key={index}
              className={`hover:z-10 rounded-lg hover:scale-150 transition-transform duration-200 ${hoveredIndex !== null && hoveredIndex !== index ? 'opacity-50' : ''}`}
              src={`${import.meta.env.VITE_API_URL}/${image}`}
              alt="Heatmap"
              onMouseEnter={() => handleImageHover(index)}
              onMouseLeave={handleImageLeave}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadImages;
