import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import AppMain from './App' // твой существующий фронт
import News from './News'   // страница новостей

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()


export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <nav style={{ padding: 20 }}>
          <Link to="/" style={{ marginRight: 20 }}>Главная</Link>
          <Link to="/news">Новости</Link>
        </nav>
        <Routes>
          <Route path="/" element={<AppMain />} />
          <Route path="/main" element={<AppMain />} />
          <Route path="/news" element={<News />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}
