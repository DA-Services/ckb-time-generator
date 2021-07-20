const packageJson = require('./package.json')
const abcConfig = require('./abc.config')

function generateApp (name, entry, env) {
  const isProd = env === 'production'
  const appName = `${packageJson.name}_${name}`

  return {
    name: appName,
    script: entry,
    instances: isProd ? 1 : 1,
    exec_mode: 'cluster',
    watch: false,
    error_file: `logs/${appName}.stderr.log`,
    out_file: `logs/${appName}.stdout.log`,
    log_date_format: 'MM-DD HH:mm:ss',
    kill_timeout: 10 * 1000, // ms
    listen_timeout: 10 * 1000, // ms
    env: {
      NODE_ENV: 'production',
    }
  }
}

module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    generateApp('time', 'dist/src/start-timestamp.js', 'production'),
    generateApp('block', 'dist/src/start-blocknumber.js', 'production'),
    generateApp('quote', 'dist/src/start-quote.js', 'production'),
  ]
}
