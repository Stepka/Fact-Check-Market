import { useState, useEffect } from 'react'
import { fetchFacts } from './NewsAPI'
import { createClaim } from './contract' // твои функции для работы с контрактом

export default function News({ onAddFact }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNews = async () => {
      const apiFacts = await fetchFacts()
      setNews(apiFacts)
      setLoading(false)
    }
    loadNews()
  }, [])

  const addFact = async (fact) => {
    try {
      // В контракте создаём новый факт с коротким deadline
      const deadline = Math.floor(Date.now() / 1000) + 60 * 5 // через 5 минут
      await createClaim(fact.description, deadline)
      if (onAddFact) onAddFact(fact) // опционально уведомляем родителя
      alert('Факт добавлен на рынок!')
    } catch (err) {
      alert('Ошибка при добавлении факта: ' + err.message)
    }
  }

  if (loading) return <p>Загрузка новостей...</p>

  return (
    <div style={{ padding: 20 }}>
      <h1>📰 Новости для добавления как факты</h1>
      {news.map((n) => (
        <div
          key={n.id}
          style={{
            border: '1px solid #ccc',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <p><b>{n.description}</b></p>
          <p>Источник: {n.source}</p>
          <button onClick={() => addFact(n)}>Добавить факт на проверку</button>
        </div>
      ))}
    </div>
  )
}
