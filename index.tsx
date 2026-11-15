import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { ChartSettingsProvider } from './contexts/ChartSettingsContext';
import { LanguageProvider } from './i18n';

// cronografosideral.com/  → landing (página de vendas)
// cronografosideral.com/app (e qualquer outro endereço) → o app
const path = window.location.pathname.replace(/\/+$/, '');
const isLanding = path === '' || path === '/index.html';
const App = lazy(() => import('./App').then(m => ({ default: m.App })));
const LandingSite = lazy(() => import('./src/landing/LandingSite'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#040004' }} />}>
      {isLanding ? (
        <LandingSite />
      ) : (
        <LanguageProvider>
          <ChartSettingsProvider>
            <App />
          </ChartSettingsProvider>
        </LanguageProvider>
      )}
    </Suspense>
  </React.StrictMode>
);