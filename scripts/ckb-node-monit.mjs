// Start command:
// pm2 start --cron-restart="* * * * *" \
// ./ckb-node-monit.mjs -- \
// --log /path_to_ckb_node_log_dir/run.log \
// --data ./ckb-node-status.json


import fs from 'fs'
import readline from 'readline'
import { spawn } from 'child_process'

const newBlockTimeout = 180 * 1000; // 3 minutes
const restartTimeout = 300 * 1000; // 5 minutes

(async () => {
  const { logFilePath, dataFilePath } = parseArgs();
  const previousStatus = readStatusFromFile(dataFilePath);

  const now = new Date();
  const timePassed = now - new Date(previousStatus.timestamp);
  const lastRestartPassed = now - new Date(previousStatus.lastRestartAt);
  const latesHeight = await getLatestHeight(logFilePath);

  if (latesHeight === previousStatus.latestHeight) {
    // If no new block for 3 minutes and the node has not been restarted for 5 minutes, try restart it again.
    if (timePassed > newBlockTimeout && lastRestartPassed > restartTimeout) {
      log('warning', `The CKB node has stayed at height ${latesHeight} for more than 3 minutes, restarting it ...`);

      restartCKBNode();

      const newStatus = { ...previousStatus, lastRestartAt: now.toISOString() };
      writeStatusToFile(dataFilePath, newStatus);
    } else {
      // No new block, keep waiting
      // log('info', 'Waiting for new block ...')
    }
  } else {
    // If new block is found, update the status.
    log('info', `Record height ${latesHeight} into ${dataFilePath} ...`);

    const newStatus = { ...previousStatus, latesHeight, timestamp: now.toISOString() };
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

  let latesHeight = null;
  const regex = /^[0-9-:\s.+]+ ChainService INFO ckb_chain::chain\s+block: (\d+)/;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      latesHeight = parseInt(match[1], 10);
    }
  }

  return latesHeight;
}

function parseArgs () {
  const args = process.argv.slice(2);
  const logFilePathIndex = args.indexOf('--log') !== -1 ? args.indexOf('--log') : args.indexOf('-l');
  const dataFilePathIndex = args.indexOf('--data') !== -1 ? args.indexOf('--data') : args.indexOf('-d');

  if (logFilePathIndex === -1 || logFilePathIndex + 1 >= args.length) {
    log('error', 'Usage: node script.js --log <path-to-logfile> --data <path-to-datafile>');
    process.exit(1);
  }

  const logFilePath = args[logFilePathIndex + 1];
  const dataFilePath = dataFilePathIndex !== -1 && dataFilePathIndex + 1 < args.length ? args[dataFilePathIndex + 1] : 'ckb-node-status.json';

  return { logFilePath, dataFilePath };
}

function readStatusFromFile (dataFilePath) {
  if (!fs.existsSync(dataFilePath)) {
    return { latestHeight: null, timestamp: null, lastRestartAt: null };
  }

  try {
    const status = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    return { latestHeight: status.latestHeight, timestamp: status.timestamp, lastRestartAt: status.lastRestartAt };
  } catch (_) {
    return { latestHeight: null, timestamp: null, lastRestartAt: null };
  }
}

function writeStatusToFile (dataFilePath, status) {
  const fieldsToWrite = {
    latestHeight: status.latesHeight,
    timestamp: status.timestamp ?? new Date().toISOString(),
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
