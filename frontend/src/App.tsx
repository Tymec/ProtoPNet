import {
  HabitatMap,
  IconToggle,
  ImageDrawer,
  ImageDropzone,
  LoadingWheel,
  PredictionsCarousel,
  UploadButton,
} from '@/components';
import { IconMap, IconMoon, IconSun, IconWorld } from '@tabler/icons-react';
import { useContext, useEffect, useState } from 'react';
import { ColorSchemeContext } from './contexts/ColorScheme';

export default function App() {
  const { colorScheme, setColorScheme } = useContext(ColorSchemeContext);

  const [optionK, setOptionK] = useState<number>(10);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
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
    let k = optionK;
    setLoading(true);

    if (isNaN(optionK) || optionK > 100) {
      setOptionK(10);
      k = 10;
      alert('K set to default: 10');
    }

    const url = `${import.meta.env.VITE_API_URL}/predict`;
    const formData = new FormData();

    formData.append('image', file);
    formData.append('k', k.toString());

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
    console.log(bird);
    setHabitatData(bird in habitats ? habitats[bird as keyof typeof habitats] : []);
  };

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-800">
      <div className="mx-auto flex w-3/4 flex-col gap-4">
        <div className="flex flex-row flex-wrap items-stretch justify-center gap-4">
          <div className={`basis-1/7 flex-shrink flex-grow ${loading ? 'animate-pulse' : ''}`}>
            <ImageDropzone
              onUpload={(file: File) => {
                setConfidenceData({});
                setHabitatData([]);
                setHeatmapImages([]);
                setBoxmapImages([]);
                setSelectedFile(file);
              }}
            />
            {loading && <LoadingWheel absolute />}
          </div>
          <PredictionsCarousel
            confidenceData={confidenceData}
            loading={loading}
            onUpdateBird={updateHabitatData}
          />
          <div className="flex flex-auto flex-col items-center justify-center rounded-lg bg-gray-200 shadow-md shadow-black dark:bg-gray-700">
            <HabitatMap countries={habitatData} globe={globeMap} />
          </div>
        </div>
        <div className="flex w-full flex-row flex-wrap items-center justify-center gap-16 rounded-lg bg-gray-200 p-4 shadow-md shadow-black dark:bg-gray-700">
          <label htmlFor="k-option" className="text-gray-800 dark:text-gray-100">
            K:
            <input
              id="k-option"
              type="number"
              min="1"
              max="100"
              placeholder="1-100"
              value={optionK}
              onChange={(e) => setOptionK(parseInt(e.target.value))}
              className="ml-2 rounded-lg bg-gray-500 p-2 text-gray-200 shadow-inner shadow-black outline-none dark:bg-gray-800 dark:text-gray-100"
            />
          </label>

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
          <UploadButton
            onClick={() => selectedFile && predict(selectedFile)}
            isFileSelected={!!selectedFile}
          />
        </div>

        {heatmapImages && heatmapImages.length > 0 && (
          <ImageDrawer images={heatmapImages} overlay={boxmapImages} />
        )}
      </div>
    </div>
  );
}
