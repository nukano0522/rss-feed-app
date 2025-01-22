import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider, createTheme } from '@mui/material'

const theme = createTheme({
  // テーマの設定をここに追加できます
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
