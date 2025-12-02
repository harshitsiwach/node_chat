import { Layout } from './components/Layout'
import { Web3Provider } from './providers/Web3Provider'
import { WalletConnect } from './components/WalletConnect'

function App() {
  return (
    <Web3Provider>
      <WalletConnect />
      <Layout />
    </Web3Provider>
  )
}

export default App
