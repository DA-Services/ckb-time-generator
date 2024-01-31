import { EXCHANGES } from '../const'

export async function statusOfExchangesController () {
  for (const exchange of EXCHANGES) {
    exchange.fetchTicker('CKB/USDT')
      .then(ticker => {
        console.log(`✅ ${exchange.name}, current quote: ${ticker.close}`)
      })
      .catch(err => {
        console.log(`❌ ${exchange.name}, error message: ${err}`)
      })
  }
}
