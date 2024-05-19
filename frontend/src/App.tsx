import 'react-toastify/dist/ReactToastify.css';

import Footer from '@/components/Footer';
import { auth } from '@/firebase';
import { IconCheck, IconMap, IconMoon, IconSun, IconWorld } from '@tabler/icons-react';
import {
  User,
  isSignInWithEmailLink,
  onAuthStateChanged,
  signInWithEmailLink,
  signOut,
} from 'firebase/auth';
import { useContext, useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import HabitatMap from './components/HabitatMap';
import ImageDrawer from './components/ImageDrawer';
import ImageDropzone from './components/ImageDropzone';
import LoadingWheel from './components/LoadingWheel';
import LoginRegisterModal from './components/LoginRegisterModal';
import PredictionsCarousel from './components/PredictionsCarousel';
import UserBar from './components/UserBar';
import UserHistory from './components/UserHistory';
import { ColorSchemeContext } from './contexts/ColorScheme';
import { notify } from './utils';

export default function App() {
  const { colorScheme, setColorScheme } = useContext(ColorSchemeContext);
  const [showLogin, setShowLogin] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [imagePreview, setImagePreview] = useState<string>('');
  const [confidenceData, setConfidenceData] = useState<{ [key: string]: number }>({});
  const [documentId, setDocumentId] = useState<string>('');
  const [habitatData, setHabitatData] = useState<string[]>([]);
  const [heatmapImages, setHeatmapImages] = useState<string[]>([]);
  const [boxmapImages, setBoxmapImages] = useState<string[]>([]);
  const [flaggedImages, setFlaggedImages] = useState<number[]>([]);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const email = window.localStorage.getItem('emailForSignIn');
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            setUser(result.user);
            notify('Sign-in successful', 'success');
          })
          .catch((err) => {
            notify('Sign-in failed', 'error');
            console.error('Sign-in error:', err);
          });
      } else {
        notify('Email not found', 'error');
      }
    }

    window.history.replaceState(null, '', '/');
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLogin(false);
        setShowHistory(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const setData = (
    prediction: string,
    confidence: { [key: string]: number },
    heatmapUrls: string[],
    boxmapUrls: string[],
    documentId: string,
    flagged: number[] = []
  ) => {
    setConfidenceData(confidence);
    setHeatmapImages(heatmapUrls);
    setBoxmapImages(boxmapUrls);
    setHabitatData(prediction in habitats ? habitats[prediction as keyof typeof habitats] : []);
    setDocumentId(documentId);
    setFlaggedImages(flagged);
  };

  const clearData = () => setData('', {}, [], [], '');

  const predict = (file: File) => {
    setLoading(true);

    const url = `${import.meta.env.VITE_API_URL}/predict`;
    const formData = new FormData();

    formData.append('image', file);
    formData.append('k', `${import.meta.env.VITE_API_K}`);
    formData.append('user_id', user?.uid || 'anonymous');

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

        setData(
          data.prediction,
          data.confidence,
          data.heatmap_urls,
          data.boxmap_urls,
          data.document_id
        );
      })
      .catch((err) => {
        console.error(err);
        notify('Failed to predict', 'error');
      })
      .finally(() => setLoading(false));
  };

  const feedback = () => {
    if (flaggedImages.length === 0) {
      notify('Please select at least one image', 'error');
      return;
    }

    const content = (
      <div className="flex flex-row items-end gap-4">
        <p>Send feedback?</p>
        <button
          onClick={() => {
            sendFeedback();
            toast.dismiss();
          }}
          className="flex flex-row gap-1 rounded-md bg-green-400 p-0.5 px-1 hover:bg-green-600"
        >
          Confirm
          <IconCheck />
        </button>
      </div>
    );

    notify(content, 'warning');
  };

  const sendFeedback = () => {
    const url = `${import.meta.env.VITE_API_URL}/feedback`;
    const formData = new FormData();

    formData.append('selected_images', JSON.stringify(flaggedImages));
    formData.append('document_id', documentId);

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

        notify('Feedback sent', 'info');
        setFlaggedImages([]);
      })
      .catch((err) => {
        console.error(err);
        notify('Failed to send feedback', 'error');
      });
  };

  const updateHabitatData = (bird: string) => {
    setHabitatData(bird in habitats ? habitats[bird as keyof typeof habitats] : []);
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        notify('Logout successful', 'success');
        setUser(null);
        // clearData();
      })
      .catch((err) => {
        notify('Failed to logout', 'error');
        console.error('Failed to logout:', err);
      });
  };

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-800">
      <div className="mx-auto flex w-3/4 flex-col gap-4">
        <div className="flex flex-col justify-center gap-4 lg:flex-row lg:flex-wrap">
          <div className="flex flex-col gap-4">
            <ImageDropzone
              preview={imagePreview}
              setPreview={setImagePreview}
              onUpload={(file: File) => {
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
            {!loading && (
              <PredictionsCarousel
                confidenceData={confidenceData}
                onUpdateBird={updateHabitatData}
                onClear={() => {
                  setImagePreview('');
                  clearData();
                  notify('Data cleared', 'info');
                }}
              />
            )}
          </div>
        </div>
        <ImageDrawer
          images={heatmapImages}
          overlay={boxmapImages}
          uploaded={loading}
          selectedImages={flaggedImages}
          setSelectedImages={setFlaggedImages}
          onFeedback={feedback}
        />

        <div className="flex flex-col gap-4 sm:flex-row">
          <Footer className="order-2 flex-[3] sm:order-1" />
          <UserBar
            className="order-1 flex-[2] sm:order-2"
            user={user}
            handleLogin={() => setShowLogin(true)}
            handleLogout={handleLogout}
            handleHistory={() => setShowHistory(true)}
          />
        </div>
      </div>

      <div className="fixed left-0 top-0 p-8">
        <label className="relative mb-2 flex w-fit transition-opacity duration-500 ease-in-out hover:opacity-60">
          <input
            type="checkbox"
            aria-label="Toggle between light and dark mode"
            title="Toggle between light and dark mode"
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

      {showLogin && (
        <LoginRegisterModal
          onClose={() => {
            setShowLogin(false);
          }}
        />
      )}

      {showHistory && user && (
        <UserHistory
          userId={user.uid}
          onClose={() => setShowHistory(false)}
          onItemLoad={(item) => {
            setShowHistory(false);
            setImagePreview(item.imageUrl);
            setData(
              item.prediction,
              item.confidence,
              item.heatmapUrls,
              item.boxmapUrls,
              item.documentId,
              item.flagged
            );
          }}
        />
      )}

      <ToastContainer />
    </div>
  );
}
