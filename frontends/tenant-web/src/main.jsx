import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@fontsource/barlow-semi-condensed/latin-700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
