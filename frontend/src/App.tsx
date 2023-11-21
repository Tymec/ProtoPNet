import UploadButton from '@/components/UploadButton';
import { useState } from 'react';
import ColorSchemeToggle from './components/ColorSchemeToggle';
import ImageDropzone from './components/ImageDropzone';
import LoadingWheel from './components/LoadingWheel';
import UploadImages from './components/UploadImages';

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

  const [prediction, setPrediction] = useState<string | undefined>(undefined);
  const [confidenceData, setConfidenceData] = useState<{ [key: string]: number }>({});
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

  const confidenceToPercentage = (confidence: number) => {
    return `${confidence < 0.0001 ? '<0.01' : (confidence * 100).toFixed(2)}%`;
  };

  const predict = (file: File) => {
    let k = optionK;
    setLoading(true)

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
        setPrediction(data.prediction);
        setHeatmapImages(data.heatmap_urls);
        setBoxImages(data.box_urls);
        setConfidenceData(data.confidence);
      })
      .catch((err) => {
        console.error(err);
      }).finally(() =>
        setLoading(false)
      );
  };

  return (
    <div className="bg-white dark:bg-slate-800 min-h-screen p-8 flex flex-col gap-4">
      <div className="flex flex-row flex-wrap gap-4">
      <div className={`flex-auto relative ${loading ? 'opacity-50' : ''}`}>
        <ImageDropzone onUpload={(file) => file && setSelectedFile(file)} />
          {loading && <LoadingWheel className="absolute inset-0 m-auto" />}
      </div>
      <div className={`flex-shrink-0 flex-grow-[8] flex flex-col p-4 rounded-lg bg-gray-200 dark:bg-gray-700 relative ${loading ? 'opacity-50' : ''}`}>
        {loading && <LoadingWheel className="absolute inset-0 m-auto" />}
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Prediction</h2>
          <ul className="list-disc list-inside pl-0" style={{paddingLeft: '1em'}}>
              {prediction && (
                  <li className={`text-lg ${getCoinfidanceColor(confidenceData[prediction])}`} style={{marginLeft: '-1em'}}>
                      {prediction}: ({confidenceToPercentage(confidenceData[prediction])})
                  </li>
              )}
              {Object.entries(confidenceData)
                  .slice(1)
                  .map(([label, confidence]) => (
                      <li key={label} className="text-md text-gray-800 dark:text-gray-100" style={{marginLeft: '-1em'}}>
                          {`${label}: ${confidenceToPercentage(confidence)}`}
                      </li>
                  ))}
          </ul>
      </div>
      </div>
      <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg flex flex-row flex-wrap items-center justify-around gap-4">
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
            className="ml-2 bg-gray-500 dark:bg-gray-800 text-gray-200 dark:text-gray-100 rounded-lg p-2"
          />
        </label>
        <label htmlFor="return-type" className="text-gray-800 dark:text-gray-100">
          Return:
          <select
            id="return-type"
            value={optionReturnType}
            onChange={(e) => setOptionReturnType(e.target.value as ReturnType)}
            className="ml-2 bg-gray-500 dark:bg-gray-800 text-gray-200 dark:text-gray-100 rounded-lg p-2"
          >
            <option value={ReturnType.BOTH}>Both</option>
            <option value={ReturnType.HEATMAPS}>Heatmaps</option>
            <option value={ReturnType.BOXES}>Boxes</option>
            <option value={ReturnType.NONE}>None</option>
          </select>
        </label>
        <div className="">
          <ColorSchemeToggle />
        </div>
        <div className="">
          <UploadButton
            onClick={() => selectedFile && predict(selectedFile)}
            isFileSelected={!!selectedFile}
          />
        </div>
      </div>


      {heatmapImages && heatmapImages.length > 0 && (
        <UploadImages images={heatmapImages} />)}
  
      {boxImages && boxImages.length > 0 && (
        <UploadImages images={boxImages}/>)}

    </div>
  );
}
