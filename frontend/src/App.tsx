import {
  Footer,
  HabitatMap,
  ImageDrawer,
  ImageDropzone,
  LoadingWheel,
  PredictionsCarousel,
} from '@/components';
import { IconCheck, IconMap, IconMoon, IconSun, IconWorld } from '@tabler/icons-react';
import { useContext, useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ColorSchemeContext } from './contexts/ColorScheme';

export default function App() {
  const { colorScheme, setColorScheme } = useContext(ColorSchemeContext);

  const [lastFile, setLastFile] = useState<File | null>(null);
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

  const clearData = () => {
    setConfidenceData({});
    setHabitatData([]);
    setHeatmapImages([]);
    setBoxmapImages([]);
  };

  const notify = (msg: string | JSX.Element, role: 'info' | 'warning' | 'error' = 'info') => {
    let send = toast.info;
    if (role === 'warning') send = toast.warn;
    if (role === 'error') send = toast.error;

    send(msg, {
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'dark',
    });
  };

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
        // too many requests
        if (data.status == 429) {
          notify('Too many requests, please try again later', 'warning');
          return;
        }

        setConfidenceData(data.confidence);
        setHeatmapImages(data.heatmap_urls);
        setBoxmapImages(data.boxmap_urls);

        setHabitatData(
          data.prediction in habitats ? habitats[data.prediction as keyof typeof habitats] : []
        );
      })
      .catch((err) => {
        console.error(err);
        notify('Failed to predict', 'error');
      })
      .finally(() => setLoading(false));
  };

  const feedback = (selectedImages: number[]) => {
    if (selectedImages.length === 0) {
      notify('Please select at least one image', 'error');
      return;
    }

    // show notification with confirmation button (confirm icon)
    const content = (
      <div className="flex flex-row items-end gap-4">
        <p>Send feedback?</p>
        <button
          onClick={() => {
            sendFeedback(selectedImages);
            toast.dismiss();
          }}
          className="flex flex-row gap-1 rounded-md bg-green-400 p-0.5 hover:bg-green-600"
        >
          Confirm
          <IconCheck />
        </button>
      </div>
    );

    notify(content, 'warning');
  };

  const sendFeedback = (selectedImages: number[]) => {
    const url = `${import.meta.env.VITE_API_URL}/feedback`;
    const formData = new FormData();

    formData.append('selected_images', JSON.stringify(selectedImages));

    fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // too many requests
        if (data.status == 429) {
          notify('Too many requests, please try again later', 'warning');
          return;
        }

        // TODO: handle feedback response
        notify('Feedback sent', 'info');

        clearData();
        if (lastFile) predict(lastFile);
      })
      .catch((err) => {
        console.error(err);
        notify('Failed to send feedback', 'error');
      });
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
                setLastFile(file);
                clearData();
                predict(file);
              }}
            />
            <div className="relative overflow-hidden rounded-lg bg-gray-200 shadow-md shadow-black dark:bg-gray-700">
              <label className="absolute bottom-0 right-0 flex w-fit p-2 transition-opacity duration-500 ease-in-out hover:opacity-60">
                <input
                  type="checkbox"
                  aria-label="Toggle between globe and map view"
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
        <ImageDrawer
          images={heatmapImages}
          overlay={boxmapImages}
          uploaded={loading}
          sendFeedback={feedback}
        />

        <Footer />
      </div>

      <div className="fixed right-0 top-0 p-4">
        <label className="relative mb-2 flex w-fit transition-opacity duration-500 ease-in-out hover:opacity-60">
          <input
            type="checkbox"
            aria-label="Toggle between light and dark mode"
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
      <ToastContainer />
    </div>
  );
}
