import React, { useState } from 'react';

interface UploadButtonProps {
  onClick: () => void;
  isFileSelected: boolean;
}

const UploadButton: React.FC<UploadButtonProps> = ({ onClick, isFileSelected }) => {
  const [isClickedOnce, setIsClickedOnce] = useState(false);

  const handleClick = () => {
    if (isFileSelected || isClickedOnce) {
      onClick();
    } else {
      alert('Please select a file before uploading.');
      setIsClickedOnce(true);
    }
  };

  return (
    <button
      className={`ml-2 bg-blue-500 w-30 text-white rounded-lg p-2 ${
        isFileSelected
          ? 'transition ease-in-out delay-150 bg-blue-500 hover:-translate-y-1 hover:scale-110 hover:bg-blue-600 duration-200'
          : 'cursor-not-allowed'
      }`}
      onClick={handleClick}
      disabled={!isFileSelected && isClickedOnce}
    >
      <span className="mr-2">Upload</span>
      <svg
        className="w-6 h-6 text-white dark:text-white inline-block"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 20 16"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
        />
      </svg>
    </button>
  );
};

export default UploadButton;
