import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppFixedCell from './AppFixedCell';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AppFixedCell />
  </React.StrictMode>
);

