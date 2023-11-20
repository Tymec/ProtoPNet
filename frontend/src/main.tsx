import App from '@/App.tsx';
import { ColorSchemeProvider } from '@/contexts/ColorScheme';
import '@/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorSchemeProvider>
      <App />
    </ColorSchemeProvider>
  </React.StrictMode>
);
