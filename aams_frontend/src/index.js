import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Modal from 'react-modal'; // <-- 1. Import Modal

// 2. บอก react-modal ว่า element หลักของแอปเราคืออะไร
Modal.setAppElement('#root'); 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);