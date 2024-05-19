import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from 'react-toastify';
import { IconX } from '@tabler/icons-react';

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
        position: "bottom-right"
      });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Login successful', {
          position: "bottom-right"
        });
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Registration successful', {
          position: "bottom-right"
        });
      }
      onClose();
    } catch (error: any) {
      console.error('Authentication error', error);
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            toast.error('Email is already in use', {
              position: "bottom-right"
            });
            break;
          case 'auth/invalid-email':
            toast.error('Invalid email address', {
              position: "bottom-right"
            });
            break;
          case 'auth/weak-password':
            toast.error('Password is too weak', {
              position: "bottom-right"
            });
            break;
          default:
            toast.error('Authentication failed', {
              position: "bottom-right"
            });
        }
      } else {
        toast.error('Authentication failed', {
          position: "bottom-right"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-lg relative w-80">
        <button onClick={onClose} className="absolute top-2 right-2">
          <IconX />
        </button>
        <h2 className="text-xl font-bold mb-4 text-white">{isLogin ? 'Login' : 'Register'}</h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        {!isLogin && (
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full p-2 mb-4 border border-gray-300 rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        )}
        <button
          onClick={handleAuth}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white py-2 rounded"
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