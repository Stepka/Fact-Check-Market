import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ethers } from 'ethers'
import {
  connectWallet,
  getClaims,
  createClaim,
  voteTrue,
  voteFalse,
  resolveClaim,
  claimPayout,
  getBalance
} from './contract'

export default function App() {
  const [wallet, setWallet] = useState(null)
  const [balance, setBalance] = useState(0)
  const [newFact, setNewFact] = useState('')
  const [error, setError] = useState('')

  const { data: claims, refetch } = useQuery({
    queryKey: ['claims', wallet],
    queryFn: getClaims,
    enabled: !!wallet
  })

  // ---- Фейковые факты ----
  // useEffect(() => {
  //   if (!wallet) return

  //   const addFakeClaims = async () => {
  //     const now = Math.floor(Date.now() / 1000)
  //     const fakeClaims = [
  //       { desc: 'Факт через 1 минуту', deadline: now + 60 },       // 1 мин
  //       { desc: 'Факт через 5 минут', deadline: now + 5 * 60 },   // 5 мин
  //       { desc: 'Факт через 10 минут', deadline: now + 10 * 60 }  // 10 мин
  //     ]

  //     for (const f of fakeClaims) {
  //       await createClaim(f.desc, f.deadline)
  //     }

  //     refetch()
  //   }

  //   addFakeClaims()
  // }, [wallet])
  // -------------------------

  useEffect(() => {
    const checkWallet = async () => {
      try {
        if (!window.ethereum) return

        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts() // проверяем уже подключённые аккаунты
        if (accounts.length > 0) {
          await connect()
        }
      } catch (err) {
        alert(err.message)
        setError(err.message)
      }
    }

    checkWallet()
  }, [])

  const connect = async () => {
    try {
      const addr = await connectWallet()
      setWallet(addr)
      const bal = await getBalance()
      setBalance(bal)
    } catch (err) {
      alert(err.message)
    }
  }

  const addFact = async () => {
    if (!newFact) return
    const deadline = Math.floor(Date.now() / 1000) + 60 * 60 // 1 час
    await createClaim(newFact, deadline)
    setNewFact('')
    refetch()
  }

  const vote = async (id, type) => {
    if (type === 'true') await voteTrue(id)
    else await voteFalse(id)
    refetch()
  }

  const resolveFact = async (id, outcome) => {
    await resolveClaim(id, outcome)
    refetch()
  }

  const claim = async (id) => {
    const bal = await claimPayout(id)
    setBalance(bal)
    alert('Баланс обновлён!')
  }

  return (
    <div style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>
      <h1>🧠 Fact Check Market</h1>

      {!wallet && <button onClick={connect}>Подключить MetaMask</button>}
      {wallet && <p>Кошелек: {wallet}</p>}

      {wallet && <p>Баланс: {balance} POL</p>}

      <div style={{ marginTop: 20 }}>
        <input
          type="text"
          placeholder="Введите новый факт"
          value={newFact}
          onChange={(e) => setNewFact(e.target.value)}
          style={{ padding: 8, width: 300 }}
        />
        <button onClick={addFact} style={{ marginLeft: 8, padding: '8px 12px' }}>
          Создать факт
        </button>
      </div>

      <div style={{ marginTop: 40 }}>
        {claims &&
          claims.map((c) => {
            const total = parseFloat(c.trueShares) + parseFloat(c.falseShares)
            const truePercent = total ? Math.round((parseFloat(c.trueShares) / total) * 100) : 0
            const falsePercent = total ? Math.round((parseFloat(c.falseShares) / total) * 100) : 0

            return (
              <div
                key={c.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <p><b>{c.description}</b></p>
                <p>Вероятность: TRUE {truePercent}%, FALSE {falsePercent}%</p>

                {!c.resolved && (
                  <>
                    <button onClick={() => vote(c.id, 'true')} style={{ marginRight: 8 }}>
                      Ставка TRUE
                    </button>
                    <button onClick={() => vote(c.id, 'false')}>Ставка FALSE</button>
                    {/* <button onClick={() => resolveFact(c.id, true)} style={{ marginLeft: 8 }}>
                      Resolve TRUE
                    </button>
                    <button onClick={() => resolveFact(c.id, false)} style={{ marginLeft: 8 }}>
                      Resolve FALSE
                    </button> */}
                  </>
                )}

                {c.resolved && (
                  <>
                    <p>✅ Результат: {c.outcome ? 'TRUE' : 'FALSE'}</p>
                    <button onClick={() => claim(c.id)}>Claim Payout</button>
                  </>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
