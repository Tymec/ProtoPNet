import { useState } from 'react';

interface IconToggleProps {
  IconOn: React.ReactNode;
  IconOff: React.ReactNode;
  value: boolean;
  onChange: () => void;
}

export default function IconToggle({ IconOn, IconOff, value, onChange }: IconToggleProps) {
  const [checked, setChecked] = useState(value);

  const handleChange = () => {
    setChecked(!checked);
    onChange();
  };

  return (
    <label className="relative flex w-fit">
      <input
        type="checkbox"
        aria-labelledby="color scheme toggle"
        className="peer absolute appearance-none"
        checked={checked}
        onChange={handleChange}
      />
      <span className="flex h-10 w-16 flex-shrink-0 items-center rounded-full bg-gray-300 p-1 shadow-inner shadow-black transition-transform duration-300 ease-in-out after:h-8 after:w-8 after:rounded-full after:bg-white after:shadow-md after:shadow-black after:duration-300 peer-checked:bg-green-400 peer-checked:after:translate-x-6 peer-checked:after:bg-white">
        <span
          className={`absolute z-10 p-1 transition-transform duration-300 ease-in-out ${
            checked ? 'translate-x-6' : '-translate-x-0'
          }`}
        >
          {checked ? IconOn : IconOff}
        </span>
      </span>
    </label>
  );
}
