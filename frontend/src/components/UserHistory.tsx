import useOutsideClick from '@/hooks/OnOutsideClick';
import { notify } from '@/utils';
import { IconX } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import LoadingWheel from './LoadingWheel';

interface HistoryItem {
  image: string;
  prediction: string;
  heatmaps: string[];
  flagged: string[];
  timestamp: string;
}

interface UserHistoryProps {
  userId: string;
  onClose: () => void;
}

const UserHistory: React.FC<UserHistoryProps> = ({ userId, onClose }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  useOutsideClick(modalRef, onClose);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/user_history?user_id=${userId}`
        );
        const data = await response.json();
        const formattedData = data.history.map((item: HistoryItem) => {
          const date = new Date(`${item.timestamp}Z`);
          const formattedMinutes = date.getMinutes().toString().padStart(2, '0');
          const formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
          const formattedDate = `${date.getDate()}/${formattedMonth}/${date.getFullYear()}, ${date.getHours()}:${formattedMinutes}`;

          return {
            image: item.image,
            prediction: item.prediction,
            timestamp: formattedDate,
            heatmaps: item.heatmaps.map((url) => String(url)),
            flagged: item.flagged.map((url) => String(url)),
          };
        });
        setHistory(formattedData);
      } catch (error) {
        console.error('Failed to fetch user history:', error);
        notify('Failed to fetch user history', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex h-full items-center justify-center bg-gray-800 bg-opacity-75">
        <LoadingWheel />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center bg-gray-800 bg-opacity-75 p-4">
      <div
        ref={modalRef}
        className="w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-4 shadow-lg dark:bg-gray-700 dark:text-white"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">History</h2>
          <button onClick={onClose} className=" hover:text-red-700 dark:text-white">
            <IconX />
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {history.length === 0 ? (
            <p>No history available.</p>
          ) : (
            <>
              {history.map((item, index) => (
                <div key={index} className="rounded-lg border p-4 dark:border-gray-600">
                  <p>
                    <strong>Date:</strong> {item.timestamp}
                  </p>
                  <p>
                    <strong>Prediction:</strong> {item.prediction}
                  </p>
                  <div className="flex space-x-4 overflow-x-auto">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={`Image ${index}`}
                        className="mr-4 h-32 w-32 object-cover"
                      />
                    )}

                    {item.heatmaps.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Heatmap ${idx}`}
                        className={`h-32 w-32 object-cover ${
                          item.flagged.includes(idx.toString()) ? 'border-2 border-red-500' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserHistory;
