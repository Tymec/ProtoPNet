import {
  HabitatMap,
  IconToggle,
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
    formData.append('k', '10');

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
      <div className="mx-auto flex w-4/5 flex-col gap-4">
        <div className="flex flex-col justify-center gap-4 lg:flex-row lg:flex-wrap">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <ImageDropzone
                onUpload={(file: File) => {
                  setConfidenceData({});
                  setHabitatData([]);
                  setHeatmapImages([]);
                  setBoxmapImages([]);
                  predict(file);
                }}
              />
            </div>
            <div className="overflow-hidden rounded-lg bg-gray-200 shadow-md shadow-black dark:bg-gray-700">
              <HabitatMap countries={habitatData} globe={globeMap} />
            </div>
          </div>

          <div
            className={`flex-[3] rounded-lg bg-gray-200 p-4 shadow-md shadow-black dark:bg-gray-700
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

        <div className="flex w-full flex-row flex-wrap items-center justify-center gap-16 rounded-lg bg-gray-200 p-4 shadow-md shadow-black dark:bg-gray-700">
          <IconToggle
            IconOn={<IconWorld />}
            IconOff={<IconMap />}
            value={globeMap}
            onChange={() => setGlobeMap((g) => !g)}
          />
          <IconToggle
            IconOn={<IconMoon />}
            IconOff={<IconSun />}
            value={colorScheme === 'dark'}
            onChange={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
          />
        </div>
        {heatmapImages && heatmapImages.length > 0 && (
          <ImageDrawer images={heatmapImages} overlay={boxmapImages} />
        )}
      </div>
    </div>
  );
}
