import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
//import AppFixedCell from './AppFixedCell';
import AppScrollable from './AppScrollable';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AppScrollable />
  </React.StrictMode>
);

