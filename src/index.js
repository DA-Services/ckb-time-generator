const { createTimeCell } = require('./time/create')
const { updateTimeCell, getTimeIndexStateCell, getTimeInfoCell } = require('./time/update')
const { TIME_INFO_UPDATE_INTERVAL } = require('./utils/config')
const { getLatestTimestamp } = require('./time/helper')

const startTimeServer = async () => {
  const { timeIndexStateCell, timeIndexState } = await getTimeIndexStateCell()
  if (!timeIndexStateCell) {
    await createTimeCell()
    setTimeout(startUpdateTimeInfoCell, TIME_INFO_UPDATE_INTERVAL * 1000)
    return
  }

  const { timeInfo } = await getTimeInfoCell(timeIndexState.getTimeIndex())
  const nextUpdateTime = getNextUpdateTime(timeInfo.getTimestamp())
  setTimeout(startUpdateTimeInfoCell, nextUpdateTime)
}

const getNextUpdateTime = currentTime => {
  if (currentTime === 0) {
    return TIME_INFO_UPDATE_INTERVAL * 1000
  }
  let nextUpdateTime = currentTime + TIME_INFO_UPDATE_INTERVAL - getLatestTimestamp()
  nextUpdateTime = nextUpdateTime < 0 ? 0 : nextUpdateTime
  return nextUpdateTime * 1000
}

const startUpdateTimeInfoCell = async () => {
  try {
    await updateTimeCell()
    setTimeout(startUpdateTimeInfoCell, TIME_INFO_UPDATE_INTERVAL * 1000)
  } catch (err) {
    console.error(err)
    setTimeout(startUpdateTimeInfoCell, (TIME_INFO_UPDATE_INTERVAL / 2) * 1000)
  }
}

startTimeServer()
