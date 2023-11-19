// UploadButton.tsx
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
      className={`ml-2 bg-blue-500 text-white rounded-lg p-2 ${isFileSelected ? '' : 'cursor-not-allowed'}`}
      onClick={handleClick}
      disabled={!isFileSelected && isClickedOnce}
    >
      Upload
    </button>
  );
}

export default UploadButton;
