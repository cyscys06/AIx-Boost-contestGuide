import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ProfileProvider } from './contexts/ProfileContext'
import { ContestsProvider } from './contexts/ContestsContext'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <ProfileProvider>
        <ContestsProvider>
          <App />
        </ContestsProvider>
      </ProfileProvider>
    </BrowserRouter>
  </React.StrictMode>
)
