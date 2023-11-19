import React from 'react';

interface UploadButtonProps {
  onClick: () => void;
  isFileSelected: boolean;
}

const UploadButton: React.FC<UploadButtonProps> = ({ onClick, isFileSelected }) => {
  const handleClick = () => {
    if (isFileSelected) {
      onClick();
    } else {
      alert('Please select a file before uploading.');
    }
  };

  return (
    <button
      className={`ml-2 bg-blue-500 text-white rounded-lg p-2 ${isFileSelected ? '' : 'cursor-not-allowed'}`}
      onClick={handleClick}
      disabled={!isFileSelected}
    >
      Upload
    </button>
  );
}

export default UploadButton;