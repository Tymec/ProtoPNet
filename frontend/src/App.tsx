import {
  HabitatMap,
  ImageDrawer,
  ImageDropzone,
  LoadingWheel,
  PredictionsCarousel,
} from '@/components';
import { IconMap, IconMoon, IconSun, IconWorld } from '@tabler/icons-react';
import { useContext, useEffect, useState } from 'react';
import { ColorSchemeContext } from './contexts/ColorScheme';

export default function App() {
  const { colorScheme, setColorScheme } = useContext(ColorSchemeContext);

  const [loading, setLoading] = useState(false);

  const [confidenceData, setConfidenceData] = useState<{ [key: string]: number }>({});
  const [habitatData, setHabitatData] = useState<string[]>([]);
  const [heatmapImages, setHeatmapImages] = useState<string[]>([]);
  const [boxmapImages, setBoxmapImages] = useState<string[]>([]);

  const [habitats, setHabitats] = useState<{ [key: string]: string[] }>({});
  const [globeMap, setGlobeMap] = useState(false);

  useEffect(() => {
    fetch(import.meta.env.VITE_HABITAT_DATA_URL, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => setHabitats(data))
      .catch((err) => console.error(err));
  }, []);

  const predict = (file: File) => {
    setLoading(true);

    const url = `${import.meta.env.VITE_API_URL}/predict`;
    const formData = new FormData();

    formData.append('image', file);
    formData.append('k', `${import.meta.env.VITE_API_K}`);

    fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setConfidenceData(data.confidence);
        setHeatmapImages(data.heatmap_urls);
        setBoxmapImages(data.boxmap_urls);

        setHabitatData(
          data.prediction in habitats ? habitats[data.prediction as keyof typeof habitats] : []
        );
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  const updateHabitatData = (bird: string) => {
    setHabitatData(bird in habitats ? habitats[bird as keyof typeof habitats] : []);
  };

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-800">
      <div className="mx-auto flex w-3/4 flex-col gap-4">
        <div className="flex flex-col justify-center gap-4 lg:flex-row lg:flex-wrap">
          <div className="flex flex-col gap-4">
            <ImageDropzone
              onUpload={(file: File) => {
                setConfidenceData({});
                setHabitatData([]);
                setHeatmapImages([]);
                setBoxmapImages([]);
                predict(file);
              }}
            />
            <div className="relative overflow-hidden rounded-lg bg-gray-200 shadow-md shadow-black dark:bg-gray-700">
              <label className="absolute bottom-0 right-0 flex w-fit p-2 transition-opacity duration-500 ease-in-out hover:opacity-60">
                <input
                  type="checkbox"
                  aria-labelledby="globe map toggle"
                  className="peer absolute appearance-none"
                  checked={globeMap}
                  onChange={() => setGlobeMap((g) => !g)}
                />
                {globeMap ? (
                  <IconWorld className="text-white" />
                ) : (
                  <IconMap className="text-black" />
                )}
              </label>
              <HabitatMap countries={habitatData} globe={globeMap} />
            </div>
          </div>

          <div
            className={`min-h-[250px] flex-1 rounded-lg bg-gray-200 p-4 shadow-md shadow-black dark:bg-gray-700
          ${loading ? 'animate-pulse cursor-wait' : 'cursor-default'}
          `}
          >
            {loading && (
              <div className="flex h-full w-full items-center justify-center">
                <LoadingWheel />
              </div>
            )}
            <PredictionsCarousel confidenceData={confidenceData} onUpdateBird={updateHabitatData} />
          </div>
        </div>
        <ImageDrawer images={heatmapImages} overlay={boxmapImages} uploaded={loading} />
      </div>

      <div className="fixed right-0 top-0 p-4">
        <label className="relative mb-2 flex w-fit transition-opacity duration-500 ease-in-out hover:opacity-60">
          <input
            type="checkbox"
            aria-labelledby="color scheme toggle"
            className="peer absolute appearance-none"
            checked={colorScheme === 'dark'}
            onChange={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
          />
          {colorScheme === 'dark' ? (
            <IconMoon className="text-white" />
          ) : (
            <IconSun className="text-black" />
          )}
        </label>
      </div>
    </div>
  );
}
