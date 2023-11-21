import { useState } from 'react';

interface ImageDropzoneProps {
  onUpload: (file: File | undefined) => void;
}

export default function ImageDropzone({ onUpload }: ImageDropzoneProps) {
  const [preview, setPreview] = useState<string | undefined>(undefined);

  const isImageFile = (file: File): boolean => {
    const allowedExtensions = ['png', 'jpg', 'jpeg'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension ? allowedExtensions.includes(extension) : false;
  };

  const handleFileDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];

      if (isImageFile(file)) {
        const fileUrl = URL.createObjectURL(file);
        setPreview(fileUrl);
        onUpload(file);
      } else {
        alert('Please select a valid image file (PNG, JPG, JPEG).');
      }
    }
  };

  return (
    <label className="relative flex justify-center border-2 aspect-square overflow-hidden border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-200 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
    onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}>
      {preview ? (
        <>
          <img className="object-fill aspect-square flex-none" src={preview} alt="Preview" />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-500 ease-in-out opacity-0 hover:opacity-100">
            <span className="text-white">Upload new image</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg
            className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
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
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF</p>
        </div>
      )}
      <input
        type="file"
        className="hidden"
        accept=".png, .jpg, .jpeg"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            if (isImageFile(file)) {
              const fileUrl = URL.createObjectURL(file);
              setPreview(fileUrl);
              onUpload(file);
            } else {
              alert('Please select a valid image file (PNG, JPG, JPEG).');
            }
          }
        }}
      />
    </label>
  );
}
