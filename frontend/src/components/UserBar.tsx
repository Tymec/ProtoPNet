import { IconHistory, IconLogin, IconLogout } from '@tabler/icons-react';
import { User } from 'firebase/auth';

interface UserBarProps {
  user: User | null;
  handleLogin: () => void;
  handleLogout: () => void;
  handleHistory: () => void;
  className?: string;
}

export default function UserBar({
  user,
  handleLogin,
  handleLogout,
  handleHistory,
  className = '',
}: UserBarProps) {
  return (
    <div className={`rounded-lg bg-gray-200 shadow-md shadow-black dark:bg-gray-700 ${className}`}>
      <div className="mx-auto flex flex-col flex-nowrap items-center justify-between gap-2 px-4 py-2 lg:px-6 xl:flex-row">
        <span className="text-center text-sm text-gray-500 dark:text-gray-400 lg:text-left">
          {user ? (
            <span>
              Logged in as{' '}
              <a className="font-semibold text-gray-700 dark:text-gray-300">
                {user.displayName || user.email || 'Unknown user'}
              </a>
            </span>
          ) : (
            'Not logged in'
          )}
        </span>

        <div className="flex flex-row flex-nowrap items-center justify-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 lg:gap-4">
          {user ? (
            <>
              <button
                onClick={handleLogout}
                className="inline-flex gap-2 rounded-lg p-2 shadow-sm shadow-gray-600 hover:bg-gray-50 active:bg-gray-100 dark:bg-orange-700 dark:text-white dark:hover:bg-orange-600 dark:hover:text-gray-100 dark:active:bg-orange-800 dark:active:text-gray-200"
                aria-label="Logout"
                title="Logout"
              >
                <IconLogout className="mx-auto" size={20} />
                <span className="hidden md:inline">Logout</span>
              </button>

              <button
                onClick={handleHistory}
                className="inline-flex gap-2 rounded-lg p-2 shadow-sm shadow-gray-600 hover:bg-gray-50 active:bg-gray-100 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-600 dark:hover:text-gray-100 dark:active:bg-blue-800 dark:active:text-gray-200"
                aria-label="History"
                title="History"
              >
                <IconHistory className="mx-auto" size={20} />
                <span className="hidden md:inline">History</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleLogin}
              className="inline-flex gap-2 rounded-lg p-2 shadow-sm shadow-gray-600 hover:bg-gray-50 active:bg-gray-100 dark:bg-green-700 dark:text-white dark:hover:bg-green-600 dark:hover:text-gray-100 dark:active:bg-green-800 dark:active:text-gray-200"
              aria-label="Login"
              title="Login"
            >
              <IconLogin className="mx-auto" size={20} />
              <span className="hidden md:inline">Login</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
