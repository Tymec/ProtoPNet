import { IconFidgetSpinner } from '@tabler/icons-react';

export default function LoadingWheel({ absolute = false }: { absolute?: boolean }) {
  return (
    <div
      role="status"
      className={`flex items-center justify-center
      ${absolute ? 'absolute inset-0 mx-auto' : ''}`}
    >
      <IconFidgetSpinner className="animate-spin text-blue-500" size={32} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
