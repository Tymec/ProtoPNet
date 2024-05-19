import useOutsideClick from '@/hooks/OnOutsideClick';
import { notify } from '@/utils';
import { IconArrowRight, IconX } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import LoadingWheel from './LoadingWheel';

interface HistoryItem {
  prediction: string;
  confidence: { [key: string]: number };
  imageUrl: string;
  heatmapUrls: string[];
  boxmapUrls: string[];
  documentId: string;
  flagged: number[];
  timestamp: string;
}

interface UserHistoryProps {
  userId: string;
  onClose: () => void;
  onItemLoad: (item: HistoryItem) => void;
}

const UserHistory: React.FC<UserHistoryProps> = ({ userId, onClose, onItemLoad }) => {
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
        const formattedData = data.history.map(
          (item: {
            timestamp: string;
            prediction: string;
            confidence: { [key: string]: number };
            image_url: string;
            heatmap_urls: string[];
            boxmap_urls: string[];
            document_id: string;
            flagged: number[];
          }) => {
            const date = new Date(`${item.timestamp}Z`);
            const formattedMinutes = date.getMinutes().toString().padStart(2, '0');
            const formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
            const formattedDate = `${date.getDate()}/${formattedMonth}/${date.getFullYear()}, ${date.getHours()}:${formattedMinutes}`;

            return {
              prediction: item.prediction,
              confidence: item.confidence,
              imageUrl: item.image_url,
              heatmapUrls: item.heatmap_urls,
              boxmapUrls: item.boxmap_urls,
              documentId: item.document_id,
              flagged: item.flagged,
              timestamp: formattedDate,
            };
          }
        );
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
      <div className="fixed inset-0 flex h-full items-center justify-center bg-black bg-opacity-50">
        <LoadingWheel />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        ref={modalRef}
        className="relative flex h-[90vh] min-w-[45vw] max-w-[90vw] flex-col rounded-lg bg-white p-6 shadow-md shadow-black dark:bg-slate-700 dark:text-white"
      >
        <button
          onClick={onClose}
          className="absolute right-2 top-2 hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
        >
          <IconX />
        </button>
        <h2 className="mb-4 text-2xl font-bold dark:text-white">User History</h2>

        <div className="styled-scrollbar flex snap-y flex-col overflow-y-scroll rounded-lg py-4 shadow-inner shadow-gray-800">
          {history.length === 0 ? (
            <p className="text-center">No history found</p>
          ) : (
            <>
              {history.map((item, index) => (
                <div
                  key={index}
                  onClick={() => onItemLoad(item)}
                  className="styled-scrollbar cursor-pointer snap-start snap-always border-y p-4 first:rounded-t-lg first:border-t-0 last:rounded-b-lg last:border-b-0 hover:bg-gray-100 active:bg-gray-200 dark:border-gray-600 dark:hover:bg-slate-800 dark:active:bg-slate-900"
                >
                  <p>
                    <strong>Date:</strong> {item.timestamp}
                  </p>
                  <p className="mb-2">
                    <strong>Prediction:</strong> {item.prediction}
                  </p>
                  <div className="flex gap-4 overflow-x-auto">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={`Image ${index}`}
                        className="h-32 w-32 rounded-lg object-cover"
                      />
                    )}

                    {/* Nice arrow icon */}
                    <div className="flex items-center justify-center">
                      <IconArrowRight />
                    </div>

                    {item.heatmapUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Heatmap ${idx}`}
                        className={`h-32 w-32 rounded-lg object-cover shadow-inner shadow-black ${
                          item.flagged.includes(idx) ? 'border-2 border-red-500' : ''
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
