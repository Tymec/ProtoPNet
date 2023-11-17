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
  const [heatmapImages, setHeatmapImages] = useState<string[]>([]);
  const [boxImages, setBoxImages] = useState<string[]>([]);

  function predict(file: File) {
    const url =
      `${import.meta.env.VITE_API_URL}/predict?` +
      new URLSearchParams({
        k: optionK.toString(),
        return_type: optionReturnType,
      });
  
    const formData = new FormData();
    formData.append('image', file);
  
    fetch(url, {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        setPrediction(data.prediction);
        setHeatmapImages(data.heatmap_urls);
        setBoxImages(data.box_urls);
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
        </div>
      )}
      <div className="flex flex-row items-center justify-center flex-wrap gap-4 mb-4">
        {heatmapImages.length > 0 && heatmapImages.map((image, index) => (
          <img
            key={index}
            className="rounded-lg"
            src={`${import.meta.env.VITE_API_URL}/${image}`}
            alt="Heatmap"
          />
        ))}
      </div>
      <div className="flex flex-row items-center justify-center flex-wrap gap-4">
        {boxImages.length > 0 && boxImages.map((image, index) => (
          <img
            key={index}
            className="rounded-lg"
            src={`${import.meta.env.VITE_API_URL}/${image}`}
            alt="Box"
          />
        ))}
      </div>
    </div>
  );
}
