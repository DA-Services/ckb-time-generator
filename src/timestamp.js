const { createTimeCell } = require('./time/create')
const { updateTimeCell, getTimeIndexStateCell, getTimeInfoCell } = require('./time/update')
const { getLatestTimestamp } = require('./time/helper')

const TIME_INFO_UPDATE_INTERVAL = 60

const startTimestampServer = async () => {
  const { timeIndexStateCell, timeIndexState } = await getTimeIndexStateCell(true)
  if (!timeIndexStateCell) {
    await createTimeCell(true)
    setTimeout(updateTimeInfoCell, TIME_INFO_UPDATE_INTERVAL * 1000)
    return
  }

  const { timeInfo } = await getTimeInfoCell(timeIndexState.getTimeIndex(), true)
  const nextUpdateTime = getNextUpdateTime(timeInfo.getTimestamp())
  setTimeout(updateTimeInfoCell, nextUpdateTime)
}

const getNextUpdateTime = currentTime => {
  if (currentTime === 0) {
    return TIME_INFO_UPDATE_INTERVAL * 1000
  }
  let nextUpdateTime = currentTime + TIME_INFO_UPDATE_INTERVAL - getLatestTimestamp()
  nextUpdateTime = nextUpdateTime < 0 ? 0 : nextUpdateTime
  return nextUpdateTime * 1000
}

const updateTimeInfoCell = async () => {
  try {
    await updateTimeCell(true)
    setTimeout(updateTimeInfoCell, TIME_INFO_UPDATE_INTERVAL * 1000)
  } catch (err) {
    console.error(err)
    setTimeout(updateTimeInfoCell, (TIME_INFO_UPDATE_INTERVAL / 2) * 1000)
  }
}

startTimestampServer()
