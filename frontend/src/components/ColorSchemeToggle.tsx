import { ColorSchemeContext } from '@/contexts/ColorScheme';
import { IconMoon, IconSun } from '@tabler/icons-react';
import { useContext, useState } from 'react';

export default function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useContext(ColorSchemeContext);
  const [checked, setChecked] = useState(colorScheme === 'dark');

  const handleChange = () => {
    setChecked(!checked);
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <label className="flex w-fit relative">
      <input
        type="checkbox"
        aria-labelledby="color scheme toggle"
        className="peer absolute appearance-none"
        checked={checked}
        onChange={handleChange}
      />
      <span className="flex h-10 w-16 flex-shrink-0 items-center rounded-full bg-gray-300 p-1 duration-300 ease-in-out after:h-8 after:w-8 after:rounded-full after:bg-white after:shadow-md after:duration-300 peer-checked:bg-green-400 peer-checked:after:bg-white peer-checked:after:translate-x-6">
        <span
          className={`z-10 absolute p-1 duration-300 ease-in-out ${
            checked ? 'translate-x-6' : '-translate-x-0'
          }`}
        >
          {checked ? <IconMoon /> : <IconSun />}
        </span>
      </span>
    </label>
  );
}
