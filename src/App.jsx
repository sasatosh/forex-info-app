import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [baseCurrency, setBaseCurrency] = useState('USD')
  const [exchangeRates, setExchangeRates] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // 主要通貨のリスト
  const currencies = ['USD', 'JPY', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'KRW', 'INR']

  // 為替レートを取得
  const fetchExchangeRates = async (currency) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`)

      if (!response.ok) {
        throw new Error('為替レートの取得に失敗しました')
      }

      const data = await response.json()
      setExchangeRates(data.rates)
      setLastUpdated(new Date(data.time_last_updated).toLocaleString('ja-JP'))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 初回読み込み時とbaseCurrency変更時に為替レートを取得
  useEffect(() => {
    fetchExchangeRates(baseCurrency)
  }, [baseCurrency])

  // 手動更新
  const handleRefresh = () => {
    fetchExchangeRates(baseCurrency)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>💱 為替レート情報</h1>
        <p>リアルタイムの為替レートをチェック</p>
      </header>

      <div className="controls">
        <div className="currency-selector">
          <label htmlFor="base-currency">基準通貨：</label>
          <select
            id="base-currency"
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="select"
          >
            {currencies.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRefresh}
          className="refresh-btn"
          disabled={loading}
        >
          🔄 更新
        </button>
      </div>

      {lastUpdated && (
        <div className="last-updated">
          最終更新: {lastUpdated}
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>為替レートを取得中...</p>
        </div>
      )}

      {error && (
        <div className="error">
          ⚠️ エラー: {error}
        </div>
      )}

      {!loading && !error && exchangeRates && (
        <div className="rates-container">
          <h2>1 {baseCurrency} あたりのレート</h2>
          <div className="rates-grid">
            {currencies
              .filter(curr => curr !== baseCurrency)
              .map(currency => (
                <div key={currency} className="rate-card">
                  <div className="currency-name">{currency}</div>
                  <div className="rate-value">
                    {exchangeRates[currency]?.toFixed(4) || 'N/A'}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

export default App
