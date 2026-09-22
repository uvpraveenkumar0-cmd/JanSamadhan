import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppRouter } from './router/AppRouter';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
