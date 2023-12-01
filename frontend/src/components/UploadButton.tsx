import { IconCloudUpload } from '@tabler/icons-react';
import { useState } from 'react';

interface UploadButtonProps {
  onClick: () => void;
  isFileSelected: boolean;
}

export default function UploadButton({ onClick, isFileSelected }: UploadButtonProps) {
  const [isClickedOnce, setIsClickedOnce] = useState(false);

  return (
    <button
      className={`w-30 flex select-none flex-row items-center justify-center gap-2 rounded-lg bg-blue-500 p-2 text-white shadow-inner shadow-black transition-all delay-100 duration-100 ease-in-out disabled:scale-100 disabled:cursor-not-allowed disabled:bg-gray-500 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:cursor-not-allowed disabled:hover:bg-gray-500 disabled:hover:opacity-50
      ${isFileSelected ? 'bg-blue-500 hover:scale-105 hover:bg-blue-600' : 'cursor-not-allowed'}`}
      onClick={() => {
        if (isFileSelected || isClickedOnce) {
          onClick();
        } else {
          alert('Please select a file before uploading.');
          setIsClickedOnce(true);
        }
      }}
      disabled={!isFileSelected && !isClickedOnce}
    >
      <span className="">Upload</span>
      <IconCloudUpload className="text-white dark:text-white" size={28} />
    </button>
  );
}
