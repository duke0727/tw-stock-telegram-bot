import { screenshot } from '../lib/page'
import { fetchStockData, isStockIdValid } from '../lib/stock'
import {
  tseId,
  otcId,
  chartUrl,
  chartLocator,
  tseCahrtLocator,
  otcChartLocator,
  tseChartUrl,
  otcChartUrl
} from '../../config'

const getIcon = (val) => {
  return val > 0 ? '🔼 ' : val < 0 ? '🔽 ' : ''
}

const handleLiveChart = (bot) => {
  bot.onText(/\/chart (.*)/, async (msg, match) => {
    const chatId = msg.chat.id
    const stockId = match[1]

    if (!isStockIdValid(stockId)) {
      return bot.sendMessage(chatId, '請輸入有效股號\ne.g. `/chart 2330`', {
        parse_mode: 'Markdown'
      })
    }

    const {
      name,
      currentPrice,
      risePrice,
      risePricePerc
    } = await fetchStockData(stockId)
    if (!name) {
      return bot.sendMessage(chatId, `查無 ${stockId}，請確認此股票已上市/櫃`)
    }

    const processId = await bot.sendLoadingMsg(chatId)
    const url = chartUrl.replace('STOCK_ID', stockId)
    const locator = chartLocator
    const chartBuffer = await screenshot(url, locator)
    const icon = getIcon(risePrice)
    bot.sendPhoto(chatId, chartBuffer, {
      caption: `${icon}${stockId} ${name} ${currentPrice} | ${risePrice} (${risePricePerc})`
    })
    bot.deleteMessage(chatId, processId)
  })

  bot.onText(/\/chart$/, (msg) => {
    const chatId = msg.chat.id
    bot.sendMessage(chatId, '請帶入股號\ne.g. `/chart 2330`', {
      parse_mode: 'Markdown'
    })
  })

  bot.onText(/\/chart_(otc|tse)$/, async (msg, match) => {
    const chatId = msg.chat.id
    const type = match[1].toUpperCase()
    let stockId, url, locator

    if (type === 'TSE') {
      stockId = tseId
      url = tseChartUrl
      locator = tseCahrtLocator
    } else {
      stockId = otcId
      url = otcChartUrl
      locator = otcChartLocator
    }

    const processId = await bot.sendLoadingMsg(chatId)
    const [stockData, chartBuffer] = await Promise.all([
      fetchStockData(stockId),
      screenshot(url, locator)
    ])
    const { name, currentPrice, risePrice, risePricePerc } = stockData
    const icon = getIcon(risePrice)
    bot.sendPhoto(chatId, chartBuffer, {
      caption: `${icon}${name} ${currentPrice} | ${risePrice} (${risePricePerc})`
    })
    bot.deleteMessage(chatId, processId)
  })
}

export default handleLiveChart
