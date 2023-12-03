import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';

interface PredictionsCarouselProps {
  confidenceData: { [key: string]: number };
  autoSlide?: boolean;
  autoSlideInterval?: number;
  onUpdateBird: (birdName: string) => void;
}

export default function PredictionsCarousel({
  confidenceData,
  autoSlide = false,
  autoSlideInterval = 3000,
  onUpdateBird,
}: PredictionsCarouselProps) {
  const birdNames = Object.keys(confidenceData);
  const [curr, setCurr] = useState(0);

  const prev = () => setCurr((curr) => (curr === 0 ? birdNames.length - 1 : curr - 1));
  const next = useCallback(
    () => setCurr((curr) => (curr === birdNames.length - 1 ? 0 : curr + 1)),
    [birdNames.length]
  );

  useEffect(() => {
    if (!autoSlide) return;
    const slideInterval = setInterval(next, autoSlideInterval);
    return () => clearInterval(slideInterval);
  }, [autoSlide, autoSlideInterval, next]);

  return (
    <div className="relative overflow-hidden">
      {birdNames.map((birdName) => (
        <div
          key={birdName}
          className={`text-center ${curr === birdNames.indexOf(birdName) ? 'block' : 'hidden'}`}
        >
          <div className="absolute bottom-20 left-0 right-0 flex items-center justify-center gap-2">
            {birdNames.map((bird, j) => (
              <div
                key={bird}
                className={`
                        h-3 w-3 rounded-full bg-white shadow-sm shadow-black transition-all
                        ${curr === j ? 'p-2' : 'bg-opacity-50'}
                      `}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-between p-4">
            <button
              onClick={() => {
                const updatedBirdName = birdNames[curr === 0 ? birdNames.length - 1 : curr - 1];
                onUpdateBird(updatedBirdName);
                prev();
              }}
              className="rounded-full bg-white/80 p-1 text-gray-800 shadow-sm shadow-black hover:bg-white"
            >
              <IconChevronLeft size={40} />
            </button>
            <button
              onClick={() => {
                const updatedBirdName = birdNames[curr === birdNames.length - 1 ? 0 : curr + 1];
                onUpdateBird(updatedBirdName);
                next();
              }}
              className="rounded-full bg-white/80 p-1 text-gray-800 shadow-sm shadow-black  hover:bg-white"
            >
              <IconChevronRight size={40} />
            </button>
          </div>
          <img
            src={`${import.meta.env.VITE_BIRDS_URL}/${birdName.replace(/ /g, '+')}.jpg`}
            alt={birdName}
            className="mx-auto rounded-lg object-contain shadow-md shadow-black"
          />

          <div className="mt-2 flex flex-row justify-between">
            <span className=" text-black-700 text-base font-medium dark:text-white">
              {birdName}
            </span>
            <span className="text-black-700 text-sm font-medium dark:text-white">
              {confidenceData[birdName] < 0.0001
                ? '<0.01'
                : (confidenceData[birdName] * 100).toFixed(2)}
              %
            </span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-gray-400 shadow-inner shadow-black dark:bg-gray-600">
            <div
              className="h-2.5 animate-slider rounded-full bg-blue-500 shadow-sm shadow-black ease-in-out"
              style={{
                width: `${Math.round(confidenceData[birdName] * 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
