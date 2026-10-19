// src/main.tsx — app entry point.
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n/I18nProvider';
import './index.css';

const el = document.getElementById('root');
if (!el) throw new Error('Root element #root not found');
createRoot(el).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
