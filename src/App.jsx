import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [baseCurrency, setBaseCurrency] = useState('JPY')
  const [exchangeRates, setExchangeRates] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // 主要通貨のリスト
  const currencies = ['USD', 'JPY', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'KRW', 'INR']

  // 通貨ごとのスプレッド設定（円単位 for JPY base, パーセント for others）
  const spreads = {
    'USD': { jpy: 1.0, percent: 0.01 },
    'EUR': { jpy: 1.5, percent: 0.015 },
    'GBP': { jpy: 2.0, percent: 0.015 },
    'AUD': { jpy: 1.5, percent: 0.015 },
    'CAD': { jpy: 1.5, percent: 0.015 },
    'CHF': { jpy: 2.0, percent: 0.015 },
    'CNY': { jpy: 0.5, percent: 0.02 },
    'KRW': { jpy: 0.03, percent: 0.02 },
    'INR': { jpy: 0.5, percent: 0.02 },
  }

  // TTM, TTB, TTSを計算
  const calculateRates = (ttm, currency, base) => {
    let spread = 0

    if (base === 'JPY') {
      // JPYベースの場合、円単位のスプレッド
      spread = spreads[currency]?.jpy || 1.0
      return {
        ttm: ttm,
        ttb: ttm - spread,  // 銀行が買う（顧客が売る）
        tts: ttm + spread   // 銀行が売る（顧客が買う）
      }
    } else {
      // その他の通貨ベースの場合、パーセンテージ
      const percent = spreads[currency]?.percent || 0.01
      return {
        ttm: ttm,
        ttb: ttm * (1 - percent),
        tts: ttm * (1 + percent)
      }
    }
  }

  // 為替レートを取得（履歴対応）
  const fetchExchangeRates = async (base, date) => {
    setLoading(true)
    setError(null)

    try {
      let url
      const today = new Date().toISOString().split('T')[0]

      if (date === today) {
        // 今日のデータは最新レートAPIを使用
        url = `https://api.exchangerate-api.com/v4/latest/${base}`
      } else {
        // 履歴データはFrankfurter APIを使用（無料で履歴データが取得可能）
        url = `https://api.frankfurter.app/${date}?from=${base}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('為替レートの取得に失敗しました')
      }

      const data = await response.json()
      setExchangeRates(data.rates)

      if (data.date) {
        setLastUpdated(new Date(data.date).toLocaleString('ja-JP'))
      } else if (data.time_last_updated) {
        setLastUpdated(new Date(data.time_last_updated).toLocaleString('ja-JP'))
      }
    } catch (err) {
      setError(err.message || '為替レートの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 初回読み込み時と設定変更時に為替レートを取得
  useEffect(() => {
    fetchExchangeRates(baseCurrency, selectedDate)
  }, [baseCurrency, selectedDate])

  // 手動更新
  const handleRefresh = () => {
    fetchExchangeRates(baseCurrency, selectedDate)
  }

  // 日付の変更
  const handleDateChange = (e) => {
    const newDate = e.target.value
    const today = new Date().toISOString().split('T')[0]

    // 未来の日付は選択できないようにする
    if (newDate <= today) {
      setSelectedDate(newDate)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>💱 為替レート情報</h1>
        <p>TTM（仲値）・TTB（買相場）・TTS（売相場）を表示</p>
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

        <div className="date-selector">
          <label htmlFor="selected-date">日付：</label>
          <input
            type="date"
            id="selected-date"
            value={selectedDate}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
            className="date-input"
          />
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
          <h2>1 {baseCurrency} あたりのレート（{selectedDate}）</h2>
          <div className="rates-grid">
            {currencies
              .filter(curr => curr !== baseCurrency)
              .map(currency => {
                const ttm = exchangeRates[currency]
                if (!ttm) return null

                const rates = calculateRates(ttm, currency, baseCurrency)
                const decimals = baseCurrency === 'JPY' ? 2 : 4

                return (
                  <div key={currency} className="rate-card">
                    <div className="currency-name">{currency}</div>
                    <div className="rates-detail">
                      <div className="rate-row ttm">
                        <span className="rate-label">TTM（仲値）</span>
                        <span className="rate-value">{rates.ttm.toFixed(decimals)}</span>
                      </div>
                      <div className="rate-row ttb">
                        <span className="rate-label">TTB（買相場）</span>
                        <span className="rate-value">{rates.ttb.toFixed(decimals)}</span>
                      </div>
                      <div className="rate-row tts">
                        <span className="rate-label">TTS（売相場）</span>
                        <span className="rate-value">{rates.tts.toFixed(decimals)}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            }
          </div>

          <div className="info-box">
            <h3>💡 用語説明</h3>
            <ul>
              <li><strong>TTM（仲値）</strong>: 銀行が公示する基準レート</li>
              <li><strong>TTB（買相場）</strong>: 銀行が外貨を買う（顧客が売る）レート</li>
              <li><strong>TTS（売相場）</strong>: 銀行が外貨を売る（顧客が買う）レート</li>
            </ul>
            <p className="note">※ スプレッド（手数料）は一般的な目安値を使用しています</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
