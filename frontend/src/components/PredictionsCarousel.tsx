import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import { LoadingWheel } from ".";

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

  const prev = () =>
    setCurr((curr) => (curr === 0 ? birdsNames.length - 1 : curr - 1));
  const next = () =>
    setCurr((curr) => (curr === birdsNames.length - 1 ? 0 : curr + 1));

  useEffect(() => {
    if (!autoSlide) return;
    const slideInterval = setInterval(next, autoSlideInterval);
    return () => clearInterval(slideInterval);
  }, []);

  if (Object.keys(confidenceData).length === 0) {
    return (
      <div
        className={`flex flex-shrink flex-grow basis-1/5 flex-col rounded-lg bg-gray-200 p-4 dark:bg-gray-700 ${
          loading ? "animate-pulse" : ""
        } shadow-md shadow-black`}
      >
        {loading && <LoadingWheel absolute />}
        <h2
          className="text-2xl font-semibold text-gray-800 shadow-white dark:text-gray-100 dark:shadow-black text-center"
          style={{
            textShadow: "0px 3px 2px var(--tw-shadow-color)",
          }}
        >
          Predictions
        </h2>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-shrink flex-grow basis-1/5 flex-col rounded-lg bg-gray-200 p-4 dark:bg-gray-700 ${
        loading ? "animate-pulse" : ""
      } shadow-md shadow-black`}
    >
      {loading && <LoadingWheel absolute />}
      <div className="overflow-hidden relative">
        {birdsNames.map((birdName) => (
            <div
              key={birdName}
              style={{
                display: curr === birdsNames.indexOf(birdName) ? "block" : "none",
                textAlign: "center", 
              }}
              className="w-full"
            >
            <div>
              <div className="absolute bottom-20 right-0 left-0">
                <div className="flex items-center justify-center gap-2">
                  {birdsNames.map((bird, j) => (
                    <div
                      key={bird}
                      className={`
                        transition-all w-3 h-3 bg-white rounded-full
                        ${curr === j ? "p-2" : "bg-opacity-50"}
                      `}
                    />
                  ))}
                </div>
                </div>
              <img
                src={`https://placehold.co/500x500?text=<${birdName} image>`}
                alt={birdName}
                className="w-full"
                style={{borderRadius: "10px"}}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-between p-4">
              <button
                onClick={() => {
                  const updatedBirdName = birdsNames[curr === 0 ? birdsNames.length - 1 : curr - 1];
                  onUpdateBird(updatedBirdName);
                  prev();
                }}
                className="p-1 rounded-full shadow bg-white/80 text-gray-800 hover:bg-white"
              >
                <ChevronLeft size={40} />
              </button>
              <button
                onClick={() => {
                  const updatedBirdName = birdsNames[curr === birdsNames.length - 1 ? 0 : curr + 1];
                  onUpdateBird(updatedBirdName);
                  next();
                }}
                className="p-1 rounded-full shadow bg-white/80 text-gray-800 hover:bg-white"
              >
                <ChevronRight size={40} />
              </button>
            </div>
          
            <div className="mt-2">
              <div className="mb-1 flex justify-between">
                <span className="text-black-700 text-base font-medium dark:text-white">
                  {birdName}
                </span>
                <span className="text-black-700 text-sm font-medium dark:text-white">
                  {confidenceData[birdName] < 0.0001
                    ? "<0.01"
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
