import config from 'config'
import defaultConfig from '../config/default'

type Config = typeof defaultConfig

// todo: here is a temp workaround, should be fixed in the future
export default config.default || config as Config