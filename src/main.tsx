import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/jetbrains-mono/400';
import '@fontsource/jetbrains-mono/500';
import '@fontsource/jetbrains-mono/700';
import '@fontsource/archivo-black/400';
import '@fontsource/big-shoulders-display/900';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
