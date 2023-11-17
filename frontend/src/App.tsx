import { useState } from 'react';
import './App.css';
import ImageDropzone from './components/ImageDropzone';

enum ReturnType {
  BOTH = 'both',
  HEATMAPS = 'heatmaps',
  BOXES = 'boxes',
}

export default function App() {
  const [prediction, setPrediction] = useState<string | undefined>(undefined);
  const [heatmapImages, setHeatmapImages] = useState<string[]>([]);
  const [boxImages, setBoxImages] = useState<string[]>([]);

  function predict(file: File, k: number = 10, returnType: ReturnType = ReturnType.BOTH) {
    const url =
      `${import.meta.env.VITE_API_URL}/predict?` +
      new URLSearchParams({
        k: k.toString(),
        return_type: returnType,
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
      <ImageDropzone onUpload={predict} />
      {prediction && (
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-2xl font-semibold text-gray-100">Prediction</h2>
          <p className="text-gray-400">{prediction}</p>
        </div>
      )}
      <div className="flex flex-col items-center justify-center">
        {heatmapImages.length > 0 && heatmapImages.map((image, index) => (
          <img
            key={index}
            className="rounded-lg"
            src={`${import.meta.env.VITE_API_URL}/${image}`}
            alt="Heatmap"
          />
        ))}
      </div>
      <div className="flex flex-col items-center justify-center">
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
