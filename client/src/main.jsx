import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import { Toaster } from 'sonner';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import App from './App.jsx';
import './styles.css';

// MotionConfig: one timing family for every layout move; "user" honours prefers-reduced-motion.
createRoot(document.getElementById('root')).render(
  <MotionConfig reducedMotion="user" transition={{ type: 'spring', duration: 0.4, bounce: 0 }}>
    <App />
    <Toaster theme="system" position="bottom-right" closeButton={false} offset={20} mobileOffset={12}
      toastOptions={{ duration: 5000 }} />
  </MotionConfig>
);
