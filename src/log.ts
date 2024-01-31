import { createLogger, format, transports } from 'winston'

import config from './config'
import { getCurrentServer } from './utils/env'

const server = getCurrentServer();

export const rootLogger = createLogger({
  level: config.Loglevel,
  defaultMeta: {
    server: server,
    pid: process.pid,
    env: config.Env,
  },
  format: format.combine(
    format.metadata(),
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console()
  ],
})
