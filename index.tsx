import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ChartSettingsProvider } from './contexts/ChartSettingsContext';
import { LanguageProvider } from './i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <ChartSettingsProvider>
        <App />
      </ChartSettingsProvider>
    </LanguageProvider>
  </React.StrictMode>
);