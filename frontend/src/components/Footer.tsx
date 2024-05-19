import {
  IconBrain,
  IconBrandGithub,
  IconCompass,
  IconFeather,
  IconFiles,
} from '@tabler/icons-react';

interface FooterProps {
  className?: string;
}

export default function Footer({ className = '' }: FooterProps) {
  return (
    <footer
      className={`rounded-lg bg-gray-200 shadow-md shadow-black dark:bg-gray-700 ${className}`}
    >
      <div className="mx-auto flex flex-col items-center justify-between gap-2 px-4 py-2 md:flex-row lg:px-6">
        <span className="text-center text-sm text-gray-500 dark:text-gray-400 lg:text-left">
          Licenced under the{' '}
          <a
            href="https://github.com/Tymec/ProtoPNet/blob/main/LICENSE"
            className="font-semibold hover:underline"
          >
            MIT LICENCE
          </a>
        </span>

        <div className="flex flex-row flex-wrap items-center justify-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400 lg:gap-8">
          <a href="https://geojson-maps.kyd.au/" className="hover:underline">
            <IconCompass className="mx-auto" size={20} />
            <span className="hidden md:inline">Vector map</span>
          </a>
          <a href="https://avibase.bsc-eoc.org/" className="hover:underline">
            <IconFeather className="mx-auto" size={20} />
            <span className="hidden md:inline">Avibase</span>
          </a>
          <a href="https://paperswithcode.com/dataset/cub-200-2011" className="hover:underline">
            <IconFiles className="mx-auto" size={20} />
            <span className="hidden md:inline">Dataset</span>
          </a>
          <a href="https://github.com/cfchen-duke/ProtoPNet" className="hover:underline">
            <IconBrain className="mx-auto" size={20} />
            <span className="hidden md:inline">ProtoPNet</span>
          </a>
          <a href="https://github.com/Tymec/ProtoPNet" className="hover:underline">
            <IconBrandGithub className="mx-auto" size={20} />
            <span className="hidden md:inline">Source code</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
