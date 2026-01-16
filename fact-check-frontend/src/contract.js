import { ethers } from 'ethers'

export const CONTRACT_ADDRESS = '0xee705A2A47821dd5Ec58f32D437f5512E08B180c'

export const ABI = [
  "function claimCount() view returns (uint256)",
  "function claims(uint256) view returns (string description, uint256 deadline, bool resolved, bool outcome, uint256 trueShares, uint256 falseShares)",
  "function createClaim(string calldata description, uint256 deadline) returns (uint256)",
  "function buyTrue(uint256 claimId) payable",
  "function buyFalse(uint256 claimId) payable",
  "function resolve(uint256 claimId, bool outcome)",
  "function claimPayout(uint256 claimId)"
]

let provider
let signer
let contract

export const connectWallet = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask не найден! Установите расширение браузера.')
  }

  // ethers v6: BrowserProvider вместо Web3Provider
  provider = new ethers.BrowserProvider(window.ethereum)
  
  const accounts = await provider.listAccounts() // проверяем уже подключённые аккаунты
  if (accounts.length > 0) {
    signer = accounts[0]
  } else {

    await provider.send('eth_requestAccounts', []) // запрос разрешения в MetaMask
    signer = await provider.getSigner() // ethers v6
  }

  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)

  const address = await signer.getAddress() // вернёт адрес
  return address
}

export const getClaims = async () => {
  if (!contract) throw new Error('Подключите кошелек через MetaMask')
  const count = await contract.claimCount()
  const arr = []
  for (let i = 0; i < count; i++) {
    const c = await contract.claims(i)
    arr.push({
      id: i,
      description: c.description,
      resolved: c.resolved,
      outcome: c.outcome,
      trueShares: ethers.formatEther(c.trueShares),
      falseShares: ethers.formatEther(c.falseShares)
    })
  }
  return arr
}

export const createClaim = async (description, deadline) => {
  if (!contract) throw new Error('Подключите кошелек через MetaMask')
  const tx = await contract.createClaim(description, deadline)
  await tx.wait()
}

export const voteTrue = async (id, amountEth = '0.01') => {
  if (!contract) throw new Error('Подключите кошелек через MetaMask')
  const tx = await contract.buyTrue(id, { value: ethers.parseEther(amountEth) })
  await tx.wait()
}

export const voteFalse = async (id, amountEth = '0.01') => {
  if (!contract) throw new Error('Подключите кошелек через MetaMask')
  const tx = await contract.buyFalse(id, { value: ethers.parseEther(amountEth) })
  await tx.wait()
}

export const resolveClaim = async (id, outcome) => {
  if (!contract) throw new Error('Подключите кошелек через MetaMask')
  const tx = await contract.resolve(id, outcome)
  await tx.wait()
}

export const claimPayout = async (id) => {
  if (!contract) throw new Error('Подключите кошелек через MetaMask')
  const tx = await contract.claimPayout(id)
  await tx.wait()
  const bal = await provider.getBalance(await signer.getAddress())
  return ethers.formatEther(bal)
}

// читаем баланс подключённого кошелька
export const getBalance = async () => {
  if (!provider || !signer) throw new Error('Сначала подключите MetaMask через connectWallet')
  const address = await signer.getAddress()
  const bal = await provider.getBalance(address)
  return ethers.formatEther(bal) // ethers v6
}
