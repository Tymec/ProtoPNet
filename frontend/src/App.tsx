import {
  ColorSchemeToggle,
  HabitatMap,
  ImageDrawer,
  ImageDropzone,
  LoadingWheel,
  UploadButton,
} from '@/components';
import { useState } from 'react';

enum ReturnType {
  NONE = 'none',
  BOTH = 'both',
  HEATMAPS = 'heatmaps',
  BOXES = 'boxes',
}

export default function App() {
  const [optionK, setOptionK] = useState<number>(10);
  const [optionReturnType, setOptionReturnType] = useState<ReturnType>(ReturnType.BOTH);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const [confidenceData, setConfidenceData] = useState<{ [key: string]: number }>({});
  const [habitatData, setHabitatData] = useState<string[]>(['US', 'PL']);
  const [heatmapImages, setHeatmapImages] = useState<string[]>([]);
  const [boxImages, setBoxImages] = useState<string[]>([]);

  const getCoinfidanceColor = (confidence: number) => {
    if (confidence > 0.8) {
      return 'text-green-500';
    } else if (confidence >= 0.2) {
      return 'text-yellow-500';
    } else {
      return 'text-red-500';
    }
  };

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
    formData.append('return_type', optionReturnType);
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
        // setHabitatData(data.habitat);
        setHeatmapImages(data.heatmap_urls);
        setBoxImages(data.box_urls);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-white p-8 dark:bg-slate-800">
      <div className="flex flex-row flex-wrap items-stretch justify-center gap-4">
        <div className={`flex-shrink flex-grow basis-1/6 ${loading ? 'animate-pulse' : ''}`}>
          <ImageDropzone
            onUpload={(file: File) => {
              setConfidenceData({});
              //setHabitatData([]);
              setHeatmapImages([]);
              setBoxImages([]);
              setSelectedFile(file);
            }}
          />
          {loading && <LoadingWheel absolute />}
        </div>
        <div
          className={`flex flex-shrink flex-grow basis-1/5 animate-spin flex-col rounded-lg bg-gray-200 p-4 dark:bg-gray-700 ${
            loading ? 'animate-pulse' : ''
          } shadow-md shadow-black`}
        >
          {loading && <LoadingWheel absolute />}
          <h2
            className="text-2xl font-semibold text-gray-800 shadow-white dark:text-gray-100 dark:shadow-black"
            style={{
              textShadow: '0px 3px 2px var(--tw-shadow-color)',
            }}
          >
            Predictions:
          </h2>
          <div className="flex flex-col gap-4">
            {Object.entries(confidenceData).map(([label, confidence], index) => (
              <div key={index}>
                <div className="mb-1 flex justify-between">
                  <span
                    className={`text-black-700 text-base font-medium ${
                      index === 0 ? getCoinfidanceColor(confidence) : 'dark:text-white'
                    }`}
                  >
                    {label}
                  </span>
                  <span className="text-black-700 text-sm font-medium dark:text-white">
                    {confidence < 0.0001 ? '<0.01' : (confidence * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-400 shadow-inner shadow-black dark:bg-gray-600">
                  <div
                    className="h-2.5 animate-slider rounded-full bg-blue-500 shadow-sm shadow-black ease-in-out"
                    style={{ width: `${Math.round(confidence * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-auto flex-col items-center justify-center rounded-lg bg-gray-200 shadow-md shadow-black dark:bg-gray-700">
          <HabitatMap countries={habitatData} />
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
            className="rounded-lg bg-gray-500 p-2 text-gray-200 shadow-inner shadow-black outline-none dark:bg-gray-800 dark:text-gray-100"
          />
        </label>
        <label htmlFor="return-type" className="select-none text-gray-800 dark:text-gray-100">
          Return:
          <select
            id="return-type"
            value={optionReturnType}
            onChange={(e) => setOptionReturnType(e.target.value as ReturnType)}
            className="rounded-lg bg-gray-500 p-2 text-gray-200 shadow-inner shadow-black outline-none dark:bg-gray-800 dark:text-gray-100"
          >
            <option value={ReturnType.BOTH}>Both</option>
            <option value={ReturnType.HEATMAPS}>Heatmaps</option>
            <option value={ReturnType.BOXES}>Boxes</option>
            <option value={ReturnType.NONE}>None</option>
          </select>
        </label>
        <ColorSchemeToggle />
        <UploadButton
          onClick={() => selectedFile && predict(selectedFile)}
          isFileSelected={!!selectedFile}
        />
      </div>

      {heatmapImages && heatmapImages.length > 0 && (
        <ImageDrawer images={heatmapImages} overlay={boxImages} />
      )}
      {/* {boxImages && boxImages.length > 0 && <ImageDrawer images={boxImages} />} */}
    </div>
  );
}
