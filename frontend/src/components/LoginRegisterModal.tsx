import useOutsideClick from '@/hooks/OnOutsideClick';
import { notify } from '@/utils';
import { IconX } from '@tabler/icons-react';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useRef, useState } from 'react';

const LoginRegisterModal = ({ onClose }: { onClose: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useOutsideClick(modalRef, onClose);

  const auth = getAuth();

  const handleAuth = async () => {
    if (!isLogin && password !== confirmPassword) {
      notify('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        notify('Login successful');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        notify('Registration successful');
      }
      onClose();
    } catch (error) {
      const errorCode = error instanceof FirebaseError ? error.code : '';
      switch (errorCode) {
        case 'auth/email-already-in-use':
          notify('Email is already in use', 'error');
          break;
        case 'auth/invalid-email':
          notify('Invalid email address', 'error');
          break;
        case 'auth/weak-password':
          notify('Password is too weak', 'error');
          break;
        default:
          notify('Authentication failed', 'error');

          console.error('Authentication error', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="relative w-80 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-700"
      >
        <button onClick={onClose} className="absolute right-2 top-2 dark:text-white">
          <IconX />
        </button>
        <h2 className="mb-4 text-xl font-bold dark:text-white">{isLogin ? 'Login' : 'Register'}</h2>
        <input
          type="email"
          placeholder="Email"
          className="mb-4 w-full rounded border border-gray-300 p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          className="mb-4 w-full rounded border border-gray-300 p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        {!isLogin && (
          <input
            type="password"
            placeholder="Confirm Password"
            className="mb-4 w-full rounded border border-gray-300 p-2"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        )}
        <button
          onClick={handleAuth}
          className="w-full rounded bg-blue-500 py-2 text-white hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
        </button>
        <div className="mt-4 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-500 hover:underline">
            {isLogin ? 'Create an account' : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRegisterModal;
