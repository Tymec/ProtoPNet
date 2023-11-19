import { useState } from 'react';

interface ImageDropzoneProps {
  onUpload: (file: File) => void;
}

export default function ImageDropzone({ onUpload }: ImageDropzoneProps) {
  const [preview, setPreview] = useState<string | undefined>(undefined);

  const previewImage = (file: File) => {
    setPreview(URL.createObjectURL(file));
  };

  const isImageFile = (file: File): boolean => {
    const allowedExtensions = ['png', 'jpg', 'jpeg'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension ? allowedExtensions.includes(extension) : false;
  };

  return (
    <div className="flex items-center justify-center ">
      <label
        htmlFor="dropzone-file"
        className="flex flex-col items-center justify-center border-2 h-full w-full border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
      >
        {preview ? (
          <img
            className="rounded-lg"
            src={preview}
            alt="Preview"
          />
        ) : (
          <>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                SVG, PNG, JPG or GIF (MAX. 800x400px)
              </p>
            </div>
            <input
              id="dropzone-file"
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const file = e.target.files[0];

                  if (isImageFile(file)) {
                  onUpload(file);
                  previewImage(file);
                  }
                  else {
                    alert('Please select a valid image file (PNG, JPG, JPEG).');
                  }
                }
              }}
            />
          </>
        )}
      </label>
    </div>
  );
}
