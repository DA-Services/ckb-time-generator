import { createLogger, format, transports } from 'winston'

import config from './config'

export const rootLogger = createLogger({
  level: config.loglevel,
  format: format.combine(
    format.metadata(),
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console()
  ],
})
