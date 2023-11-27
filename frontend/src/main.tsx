import App from '@/App.tsx';
import { ColorSchemeProvider } from '@/contexts/ColorScheme';
import '@/index.css';
import { Analytics } from '@vercel/analytics/react';
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorSchemeProvider>
      <App />
      <Analytics />
    </ColorSchemeProvider>
  </React.StrictMode>
);
