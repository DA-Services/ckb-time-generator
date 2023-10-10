const packageJson = require('./package.json')

function generateApp (name, entry, args, env) {
  const isProd = env === 'mainnet'
  const appName = `${packageJson.name}_${name}`

  return {
    name: appName,
    script: entry,
    args,
    instances: isProd ? 1 : 1,
    exec_mode: 'cluster',
    watch: false,
    error_file: `logs/${appName}.stderr.log`,
    out_file: `logs/${appName}.stdout.log`,
    // log_date_format: 'MM-DD HH:mm:ss',
    kill_timeout: 10 * 1000, // ms
    listen_timeout: 10 * 1000, // ms
    max_memory_restart: '256M',
    env: {
      NODE_ENV: env,
      NODE_CONFIG_DIR: './config',
    }
  }
}

module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    generateApp('time', 'dist/main.js', 'update -t timestamp', process.env.NODE_ENV),
    generateApp('height', 'dist/main.js', 'update -t blocknumber', process.env.NODE_ENV),
    generateApp('quote', 'dist/main.js', 'update -t quote', process.env.NODE_ENV),
  ]
}
