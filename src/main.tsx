// Keep this import at the top of this file
// for 'react-speech-recognition' to work.
import 'regenerator-runtime/runtime';

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
