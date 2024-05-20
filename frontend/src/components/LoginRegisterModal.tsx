import { auth } from '@/firebase';
import useOutsideClick from '@/hooks/OnOutsideClick';
import { notify } from '@/utils';
import { IconX } from '@tabler/icons-react';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useRef, useState } from 'react';

const LoginRegisterModal = ({ onClose }: { onClose: () => void }) => {
  const [currentState, setCurrentState] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useOutsideClick(modalRef, onClose);

  const handleAuth = async (passwordless: boolean = false) => {
    if (currentState === 'register' && password !== confirmPassword) {
      notify('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      if (currentState === 'login' && passwordless) {
        // NOTE: If the user already has an account, this will disable password login
        await sendSignInLinkToEmail(auth, email, {
          handleCodeInApp: true,
          url: window.location.href,
        });
        window.localStorage.setItem('emailForSignIn', email);
        notify('Sign-in link sent to email', 'success');
      } else if (currentState === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        notify('Login successful', 'success');
      } else if (currentState === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(auth.currentUser!);
        notify('Registration successful', 'success');
      } else {
        await sendPasswordResetEmail(auth, email);
        notify('Password reset email sent', 'success');
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
        case 'auth/invalid-credential':
          notify('Invalid credentials', 'error');
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
        className="relative w-80 rounded-lg bg-white p-6 shadow-md shadow-black dark:bg-slate-700"
      >
        <button
          onClick={onClose}
          className="absolute right-2 top-2 hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
        >
          <IconX />
        </button>
        <h2 className="mb-4 text-xl font-bold dark:text-white">
          {currentState === 'login'
            ? 'Login'
            : currentState === 'register'
              ? 'Register'
              : 'Reset Password'}
        </h2>
        <input
          type="email"
          placeholder="Email"
          className="mb-4 w-full rounded border border-gray-300 p-2 shadow-inner shadow-gray-400 focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        {currentState !== 'reset' && (
          <input
            type="password"
            placeholder="Password"
            className="mb-4 w-full rounded border border-gray-300 p-2 shadow-inner shadow-gray-400 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        )}
        {currentState === 'register' && (
          <input
            type="password"
            placeholder="Confirm Password"
            className="mb-4 w-full rounded border border-gray-300 p-2 shadow-inner shadow-gray-400 focus:outline-none"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        )}
        <div className="flex w-full justify-between gap-2">
          <button
            onClick={() => handleAuth(false)}
            className="flex-1 rounded bg-blue-500 py-2 text-white shadow-inner shadow-gray-800 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-800 disabled:dark:bg-gray-500 disabled:dark:text-white"
            disabled={
              loading ||
              !email ||
              (currentState !== 'reset' && !password) ||
              (currentState === 'register' && !confirmPassword)
            }
          >
            {loading
              ? 'Loading...'
              : currentState === 'login'
                ? 'Login'
                : currentState === 'register'
                  ? 'Register'
                  : 'Send Email'}
          </button>
          {/* {currentState === 'login' && (
            <button
              onClick={() => handleAuth(true)}
              className="flex-1 rounded bg-blue-500 py-2 text-white shadow-inner shadow-gray-800 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-800 disabled:dark:bg-gray-500 disabled:dark:text-white"
              disabled={loading || !email}
            >
              {loading ? 'Loading...' : 'Send magic link'}
            </button>
          )} */}
        </div>

        <div className="mt-4 whitespace-nowrap text-center">
          <button
            onClick={() => setCurrentState(currentState === 'login' ? 'register' : 'login')}
            className="text-blue-500 hover:underline"
          >
            {currentState === 'login' ? 'Create an account' : 'Already have an account? Login'}
          </button>

          {currentState === 'login' && (
            <>
              <a className="mx-2 select-none text-black	dark:text-white">|</a>
              <button
                onClick={() => setCurrentState('reset')}
                className="text-blue-500 hover:underline"
              >
                Forgot password?
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginRegisterModal;
