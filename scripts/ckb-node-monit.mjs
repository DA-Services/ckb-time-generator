// Start command:
// pm2 start --cron-restart="* * * * *" \
// ./ckb-node-monit.mjs -- \
// --log /path_to_ckb_node_log_dir/run.log \
// --data ./ckb-node-status.json


import fs from 'fs'
import readline from 'readline'
import { spawn } from 'child_process'

const DEFAULT_BLOCK_TIMEOUT = 180; // 3 minutes
const DEFAULT_RESTART_TIMEOUT = 300; // 5 minutes

(async () => {
  const { logFilePath, dataFilePath, blockTimeout, restartTimeout } = parseArgs();
  const previousStatus = readStatusFromFile(dataFilePath);

  const now = new Date();
  const lastHeightPassed = now - new Date(previousStatus.lastHeightAt);
  const lastRestartPassed = now - new Date(previousStatus.lastRestartAt);
  const latestHeight = await getLatestHeight(logFilePath);

  if (latestHeight === previousStatus.latestHeight) {
    // If no new block for 3 minutes and the node has been restarted for 5 minutes, try restart it again.
    if (lastHeightPassed > blockTimeout && lastRestartPassed > restartTimeout) {
      log('warning', `The CKB node has stayed at height ${latestHeight} for more than ${Math.round(lastHeightPassed / 60) / 1000} minutes, restarting it ...`);

      restartCKBNode();

      const newStatus = { ...previousStatus, lastRestartAt: now.toISOString() };
      writeStatusToFile(dataFilePath, newStatus);
    } else {
      // No new block, keep waiting
      // log('info', 'Waiting for new block ...')
    }
  } else {
    // If new block is found, update the status.
    log('info', `Record height ${latestHeight} into ${dataFilePath} ...`);

    const newStatus = { ...previousStatus, latestHeight: latestHeight, lastHeightAt: now.toISOString() };
    writeStatusToFile(dataFilePath, newStatus);
  }
})();

/**
 * Get the latest height from the CKB node log file.
 */
async function getLatestHeight (logFilePath) {
  const tail = spawn('tail', ['-n', '50', logFilePath]);
  const lines = [];
  const rl = readline.createInterface({ input: tail.stdout });

  for await (const line of rl) {
    lines.push(line);
  }

  let latestHeight = null;
  const regex = /^[0-9-:\s.+]+ ChainService INFO ckb_chain::chain\s+block: (\d+)/;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      latestHeight = parseInt(match[1], 10);
    }
  }

  return latestHeight;
}

function parseArgs () {
  const args = process.argv.slice(2);
  const logFilePathIndex = args.indexOf('--log') !== -1 ? args.indexOf('--log') : args.indexOf('-l');
  const dataFilePathIndex = args.indexOf('--data') !== -1 ? args.indexOf('--data') : args.indexOf('-d');
  const blockTimeoutIndex = args.indexOf('--block-timeout') !== -1 ? args.indexOf('--block-timeout') : args.indexOf('-b');
  const restartTimeoutIndex = args.indexOf('--restart-timeout') !== -1 ? args.indexOf('--restart-timeout') : args.indexOf('-r');

  if (logFilePathIndex === -1 || logFilePathIndex + 1 >= args.length) {
    log('error', 'Usage: node script.js --log <path-to-logfile> --data <path-to-datafile> --block-timeout [block-timeout] --restart-timeout [restart-timeout]');
    process.exit(1);
  }

  const logFilePath = args[logFilePathIndex + 1];
  const dataFilePath = dataFilePathIndex !== -1 && dataFilePathIndex + 1 < args.length ? args[dataFilePathIndex + 1] : 'ckb-node-status.json';

  let blockTimeout = DEFAULT_BLOCK_TIMEOUT * 1000;
  let restartTimeout = DEFAULT_RESTART_TIMEOUT * 1000;

  if (blockTimeoutIndex !== -1 && blockTimeoutIndex + 1 < args.length) {
    blockTimeout = parseInt(args[blockTimeoutIndex + 1], 10);
    if (isNaN(blockTimeout)) {
      log('error', 'Invalid value for --block-timeout. Must be a number.');
      process.exit(1);
    }
  }

  if (restartTimeoutIndex !== -1 && restartTimeoutIndex + 1 < args.length) {
    restartTimeout = parseInt(args[restartTimeoutIndex + 1], 10);
    if (isNaN(restartTimeout)) {
      log('error', 'Invalid value for --restart-timeout. Must be a number.');
      process.exit(1);
    }
  }

  return { logFilePath, dataFilePath, blockTimeout, restartTimeout };
}

function readStatusFromFile (dataFilePath) {
  if (!fs.existsSync(dataFilePath)) {
    return { latestHeight: null, lastHeightAt: null, lastRestartAt: null };
  }

  try {
    const status = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    return { latestHeight: status.latestHeight, lastHeightAt: status.lastHeightAt, lastRestartAt: status.lastRestartAt };
  } catch (_) {
    return { latestHeight: null, lastHeightAt: null, lastRestartAt: null };
  }
}

function writeStatusToFile (dataFilePath, status) {
  const fieldsToWrite = {
    latestHeight: status.latestHeight,
    lastHeightAt: status.lastHeightAt,
    lastRestartAt: status.lastRestartAt,
  };

  fs.writeFileSync(dataFilePath, JSON.stringify(fieldsToWrite, null, 2));
}

function restartCKBNode () {
  const restart = spawn('systemctl', ['restart', 'ckb']);

  restart.on('close', (code) => {
    if (code === 0) {
      log('info', 'CKB node restarted successfully');
    } else {
      log('error', `CKB node restart failed with code: ${code}`);
    }
  });
}

function log (level, message) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message }));
}
