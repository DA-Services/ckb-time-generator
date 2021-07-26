const packageJson = require('./package.json')

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
      NODE_ENV: env,
      NODE_CONFIG_DIR: './dist/config',
    }
  }
}

module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    generateApp('time', 'dist/src/start-timestamp.js', process.env.NODE_ENV),
    generateApp('block', 'dist/src/start-blocknumber.js', process.env.NODE_ENV),
    generateApp('quote', 'dist/src/start-quote.js', process.env.NODE_ENV),
  ]
}
