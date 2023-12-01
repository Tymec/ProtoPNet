import { IconCloudUpload } from '@tabler/icons-react';
import { useState } from 'react';

const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg'];

interface ImageDropzoneProps {
  onUpload: (file: File) => void;
}

export default function ImageDropzone({ onUpload }: ImageDropzoneProps) {
  const [preview, setPreview] = useState<string | undefined>(undefined);

  const uploadFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileExt = file.name.split('.').pop();
    if (fileExt && ALLOWED_EXTENSIONS.includes(fileExt.toLowerCase())) {
      const fileUrl = URL.createObjectURL(file);
      setPreview(fileUrl);
      onUpload(file);
    } else {
      alert('Please select a valid image file (PNG, JPG, JPEG).');
    }
  };

  return (
    <label
      className="flex aspect-square cursor-pointer flex-col justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-200 shadow-md shadow-black hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-800"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        uploadFile(e.dataTransfer.files);
      }}
      style={{
        backgroundImage: preview ? `url(${preview})` : undefined,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
      }}
    >
      {preview ? (
        <div className="flex h-full w-full items-center justify-center bg-black bg-opacity-50 opacity-0 transition-opacity duration-500 ease-in-out hover:opacity-100">
          <span className="text-white">Upload new image</span>
        </div>
      ) : (
        <>
          <IconCloudUpload className="mx-auto h-8 w-8 text-gray-500 dark:text-gray-400" />
          <p className="mx-auto mb-2 pl-4 pr-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="mx-auto text-xs text-gray-500 dark:text-gray-400">SVG, PNG or JPG</p>
        </>
      )}
      <input
        type="file"
        className="hidden"
        accept=".png, .jpg, .jpeg"
        onChange={(e) => uploadFile(e.target.files)}
      />
    </label>
  );
}
