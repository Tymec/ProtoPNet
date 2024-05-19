import '@/index.css';

import App from '@/App.tsx';
import { ColorSchemeProvider } from '@/contexts/ColorScheme';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import React from 'react';
import ReactDOM from 'react-dom/client';

inject();
injectSpeedInsights();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorSchemeProvider>
      <App />
    </ColorSchemeProvider>
  </React.StrictMode>
);
