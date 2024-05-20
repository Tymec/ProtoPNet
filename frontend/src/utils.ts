import { toast } from 'react-toastify';

const notify = (
  msg: string | JSX.Element,
  role: 'info' | 'warning' | 'error' | 'success' = 'info'
) => {
  let send = toast.info;
  if (role === 'success') send = toast.success;
  if (role === 'warning') send = toast.warn;
  if (role === 'error') send = toast.error;

  send(msg, {
    position: 'bottom-right',
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'dark',
  });
};

export { notify };
