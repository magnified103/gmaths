import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Configure MathLive globally to use local fonts from public directory
// This prevents OTS parsing errors with local font files
if (typeof window !== 'undefined') {
  // Configure MathLive before any components load
  window.addEventListener('DOMContentLoaded', async () => {
    try {
      // Import MathLive and configure font directory
      await import('mathlive');
      if ((window as any).MathfieldElement) {
        (window as any).MathfieldElement.fontsDirectory = '/fonts/';
      }
    } catch (error) {
      console.warn('Failed to configure MathLive fonts:', error);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
