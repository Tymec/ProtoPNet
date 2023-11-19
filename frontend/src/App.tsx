import { useState } from 'react';
import './App.css';
import ImageDropzone from './components/ImageDropzone';

enum ReturnType {
  BOTH = 'both',
  HEATMAPS = 'heatmaps',
  BOXES = 'boxes',
}

export default function App() {
  const [optionK, setOptionK] = useState<number>(10);
  const [optionReturnType, setOptionReturnType] = useState<ReturnType>(ReturnType.BOTH);

  const [prediction, setPrediction] = useState<string | undefined>(undefined);
  const [confidenceData, setConfidenceData] = useState<{ [key: string]: number }>({});
  const [heatmapImages, setHeatmapImages] = useState<string[]>([]);
  const [boxImages, setBoxImages] = useState<string[]>([]);

  function getCoinfidanceColor(confidence: number): string {
    if (confidence > 0.8) {
      return 'text-green-500'; 
    } else if (confidence >= 0.2) {
      return 'text-yellow-500'; 
    } else {
      return 'text-red-500'; 
    }
  }

  function predict(file: File) {
    const url = `${import.meta.env.VITE_API_URL}/predict?`;
    const formData = new FormData();
    
    formData.append('image', file);
    formData.append('return_type', optionReturnType);
    formData.append('k', optionK.toString());

    fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'accept': 'application/json'
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setPrediction(data.prediction);
        setHeatmapImages(data.heatmap_urls);
        setBoxImages(data.box_urls);
        setConfidenceData(data.confidence)
      })
      .catch((err) => {
        console.error(err);
      });
  }
 
  return (
    <div className="bg-gray-700 min-h-screen m-0 p-0">
      <div>
        <label htmlFor="k" className="text-gray-100">
          K:
          <input
            id="k"
            type="number"
            min="1"
            max="100"
            placeholder='1 to 100'
            value={optionK}
            onChange={(e) => setOptionK(parseInt(e.target.value))}
            className="ml-2 bg-gray-800 text-gray-100 rounded-lg p-2"
          />
        </label>
        <label htmlFor="return_type" className="text-gray-100 ml-4">
          Return type:
          <select
            id="return_type"
            value={optionReturnType}
            onChange={(e) => setOptionReturnType(e.target.value as ReturnType)}
            className="ml-2 bg-gray-800 text-gray-100 rounded-lg p-2"
          >
            <option value={ReturnType.BOTH}>Both</option>
            <option value={ReturnType.HEATMAPS}>Heatmaps</option>
            <option value={ReturnType.BOXES}>Boxes</option>
          </select>
        </label>
      </div>
      <ImageDropzone onUpload={predict} />
      {prediction && (
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-2xl font-semibold text-gray-100">Prediction</h2>
          <p className="text-gray-400">{prediction}</p>
          {confidenceData[prediction] && (
            <p className={`${getCoinfidanceColor(confidenceData[prediction])} text-xl mt-2`}>
              Confidence: {Math.round(confidenceData[prediction] * 100)}%
            </p>
          )}
        </div>
      )}
      <div className="flex flex-row items-center justify-center flex-wrap gap-4 mb-4">
        {heatmapImages != null && heatmapImages.length > 0 && heatmapImages.map((image, index) => (
          <img
            key={index}
            className="rounded-lg"
            src={`${import.meta.env.VITE_API_URL}/${image}`}
            alt="Heatmap"
          />
        ))}
      </div>
      <div className="flex flex-row items-center justify-center flex-wrap gap-4">
        {boxImages != null && boxImages.length > 0 && boxImages.map((image, index) => (
          <img
            key={index}
            className="rounded-lg"
            src={`${import.meta.env.VITE_API_URL}/${image}`}
            alt="Box"
          />
        ))}
      </div>
      {Object.keys(confidenceData).length > 0 && (
        <div className="mt-4">
          <h2 className="text-2xl font-semibold text-gray-300">Alternative Predictions:</h2>
          {Object.entries(confidenceData).map(([label, confidence]) => (
            <p key={label} className="text-gray-400">{`${label}: ${confidence < 0.0001 ? '<0.01' : (confidence * 100).toFixed(2)}%`}</p>
          ))}
        </div>
      )}
    </div>
  );
}
