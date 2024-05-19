import { IconX } from '@tabler/icons-react';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { toast } from 'react-toastify';

const LoginRegisterModal = ({ onClose }: { onClose: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const auth = getAuth();

  const handleAuth = async () => {
    if (!isLogin && password !== confirmPassword) {
      toast.error('Passwords do not match', {
        position: 'bottom-right',
      });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Login successful', {
          position: 'bottom-right',
        });
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Registration successful', {
          position: 'bottom-right',
        });
      }
      onClose();
    } catch (error) {
      console.error('Authentication error', error);
      if (error instanceof FirebaseError && error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            toast.error('Email is already in use', {
              position: 'bottom-right',
            });
            break;
          case 'auth/invalid-email':
            toast.error('Invalid email address', {
              position: 'bottom-right',
            });
            break;
          case 'auth/weak-password':
            toast.error('Password is too weak', {
              position: 'bottom-right',
            });
            break;
          default:
            toast.error('Authentication failed', {
              position: 'bottom-right',
            });
        }
      } else {
        toast.error('Authentication failed', {
          position: 'bottom-right',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-80 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-700">
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
