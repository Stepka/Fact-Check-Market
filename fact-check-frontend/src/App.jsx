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
    <div className="app">
      <div className="header">
        <h1>🧠 Fact Check Market</h1>

        {!wallet ? (
          <button onClick={connect}>Connect MetaMask</button>
        ) : (
          <div className="wallet-box">
            {wallet.slice(0, 6)}...{wallet.slice(-4)} | {balance} POL
          </div>
        )}
      </div>

      {wallet && (
        <div style={{ marginBottom: 30 }}>
          <input
            placeholder="Введите новый факт"
            value={newFact}
            onChange={(e) => setNewFact(e.target.value)}
          />
          <button onClick={addFact} style={{ marginLeft: 10 }}>
            Создать факт
          </button>
        </div>
      )}

      {claims &&
        claims.map((c) => {
          const total = c.trueShares + c.falseShares
          const truePercent = total ? Math.round((c.trueShares / total) * 100) : 0
          const falsePercent = 100 - truePercent

          return (
            <div className="card" key={c.id}>
              <div className="fact-title">{c.description}</div>

              <div className="progress">
                <div className="progress-inner">
                  <div
                    className="true-bar"
                    style={{ width: `${truePercent}%` }}
                  />
                  <div
                    className="false-bar"
                    style={{ width: `${falsePercent}%` }}
                  />
                </div>
              </div>

              <p>
                TRUE {truePercent}% | FALSE {falsePercent}%
              </p>

              {!c.resolved ? (
                <>
                  <button onClick={() => vote(c.id, 'true')}>
                    Vote TRUE
                  </button>
                  <button className="secondary" onClick={() => vote(c.id, 'false')}>
                    Vote FALSE
                  </button>
                  <button
                    className="secondary"
                    onClick={() => resolveFact(c.id, true)}
                  >
                    Resolve TRUE
                  </button>
                  <button
                    className="danger"
                    onClick={() => resolveFact(c.id, false)}
                  >
                    Resolve FALSE
                  </button>
                </>
              ) : (
                <>
                  <p>✅ Result: {c.outcome ? 'TRUE' : 'FALSE'}</p>
                  <button onClick={() => claim(c.id)}>Claim payout</button>
                </>
              )}
            </div>
          )
        })}
    </div>
  )
}
