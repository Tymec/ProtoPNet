import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { LoadingWheel } from '.';

interface PredictionsCarouselProps {
  confidenceData: { [key: string]: number };
  autoSlide?: boolean;
  autoSlideInterval?: number;
  loading: boolean;
  onUpdateBird: (birdName: string) => void;
}

export default function PredictionsCarousel({
  confidenceData,
  autoSlide = false,
  autoSlideInterval = 3000,
  loading,
  onUpdateBird,
}: PredictionsCarouselProps) {
  const birdsNames = Object.keys(confidenceData);
  const [curr, setCurr] = useState(0);

  const prev = () => setCurr((curr) => (curr === 0 ? birdsNames.length - 1 : curr - 1));
  const next = useCallback(
    () => setCurr((curr) => (curr === birdsNames.length - 1 ? 0 : curr + 1)),
    [birdsNames.length]
  );

  useEffect(() => {
    if (!autoSlide) return;
    const slideInterval = setInterval(next, autoSlideInterval);
    return () => clearInterval(slideInterval);
  }, [autoSlide, autoSlideInterval, next]);

  if (Object.keys(confidenceData).length === 0) {
    return (
      <div
        className={`flex flex-shrink flex-grow basis-1/5 flex-col rounded-lg bg-gray-200 p-4 dark:bg-gray-700 ${
          loading ? 'animate-pulse' : ''
        } shadow-md shadow-black`}
      >
        {loading && <LoadingWheel absolute />}
        <h2
          className="text-center text-2xl font-semibold text-gray-800 shadow-white dark:text-gray-100 dark:shadow-black"
          style={{
            textShadow: '0px 3px 2px var(--tw-shadow-color)',
          }}
        >
          Predictions
        </h2>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-shrink flex-grow basis-1/3 flex-col rounded-lg bg-gray-200 p-4 dark:bg-gray-700 ${
        loading ? 'animate-pulse' : ''
      } shadow-md shadow-black`}
    >
      {loading && <LoadingWheel absolute />}
      <div className="relative overflow-hidden">
        {birdsNames.map((birdName) => (
          <div
            key={birdName}
            style={{
              display: curr === birdsNames.indexOf(birdName) ? 'block' : 'none',
              textAlign: 'center',
            }}
            className="w-full"
          >
            <div>
              <div className="absolute bottom-20 left-0 right-0">
                <div className="flex items-center justify-center gap-2">
                  {birdsNames.map((bird, j) => (
                    <div
                      key={bird}
                      className={`
                        h-3 w-3 rounded-full bg-white transition-all
                        ${curr === j ? 'p-2' : 'bg-opacity-50'}
                      `}
                    />
                  ))}
                </div>
              </div>
              <img
                src={`https://placehold.co/500x500?text=<${birdName} image>`}
                alt={birdName}
                className="w-full max-w-full"
                style={{ borderRadius: '10px' }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-between p-4">
              <button
                onClick={() => {
                  const updatedBirdName = birdsNames[curr === 0 ? birdsNames.length - 1 : curr - 1];
                  onUpdateBird(updatedBirdName);
                  prev();
                }}
                className=" rounded-full bg-white/80 p-1 text-gray-800 shadow hover:bg-white"
              >
                <IconChevronLeft size={40} />
              </button>
              <button
                onClick={() => {
                  const updatedBirdName = birdsNames[curr === birdsNames.length - 1 ? 0 : curr + 1];
                  onUpdateBird(updatedBirdName);
                  next();
                }}
                className="rounded-full bg-white/80 p-1 text-gray-800 shadow hover:bg-white"
              >

                <IconChevronRight size={40} />
              </button>
            </div>
            <div className="mt-2">
            <div className="mb-1 flex flex-col items-center md:flex-row md:justify-between">
              <span className=" text-black-700 text-base font-medium dark:text-white mb-2 md:mb-0">
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
          </div>
        ))}
      </div>
    </div>
  );
}
