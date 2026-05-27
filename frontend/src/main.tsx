import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import PreferencesRoot from './components/PreferencesRoot';
import 'leaflet/dist/leaflet.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PreferencesRoot>
      <App />
    </PreferencesRoot>
  </React.StrictMode>,
);
