# ckb-time-generator

[![ci](https://github.com/dotbitHQ/ckb-time-generator/actions/workflows/ci.yaml/badge.svg)](https://github.com/dotbitHQ/ckb-time-generator/actions/workflows/ci.yaml)

The generator of [ckb-time-scripts](https://github.com/DeAccountSystems/ckb-time-script).


## How to Work

- Clone and install every dependencies with [npm](https://www.npmjs.com/).
- Install [pm2](https://pm2.keymetrics.io/docs/usage/quick-start/) globally.
- Copy `config/{env}.yaml` to `config/local-{env}.yaml`, edit configs as needed.
- Run with `npm run reload_testnet` or `npm run reload_mainnet` base on environment.

> If it is needed to kown more details of the config file loading order, click this link [node-config](https://github.com/node-config/node-config/wiki/Configuration-Files#file-load-order) .


## Tool Commands

> WARNING! Pnpm may not properly execute the following commands.

- `npm run mainnet -- status -t timestamp` check status of TimeCells and their IndexStateCell on-chain.
- `npm run mainnet -- fix -t timestamp` recycle redundant TimeCells and their IndexStateCell on-chain.
- `npm run mainnet -- update -t timestamp` keep updating TimeCells and their IndexStateCell on-chain.

The `mainnet` argument can also be changed to `testnet`. Similarly, besides using `timestamp`, the `-t` option can also be set as either `height` or `quote`. For further assistance, please refer to the help information by running `npm run main -- --help`.


## Development

First, you need to create `config/local-{env}.yaml`, input private keys like below:

```typescript
loglevel: 'debug'
timestamp:
  PayersPrivateKey: '0x000000000...'
blocknumber:
  PayersPrivateKey: '0x000000000...'
quote:
  PayersPrivateKey: '0x000000000...'
```

Then, you will be able to run commands in testnet environment like below:

```bash
npm run dev

npm run testnet -- {commands}
```

The `testnet` script will load `config/local-testnet.yaml` and `config/testnet.yaml` by default.


## CKB Node Restart Script

Because of unstable network, sometimes the CKB node may disconnect from peers and stop syncing blocks. To solve this problem, the script `scripts/ckb-node-monit.mjs` can restart the CKB node automatically:

```bash
pm2 start --cron-restart="* * * * *" \
./scripts/ckb-node-monit.mjs -- \
--block-timeout 180 \
--log /path_to_ckb_node_log_dir/run.log \
--data ./ckb-node-status.json
```

> The script needs permission to execute `systemctl restart ckb-node` command, so it is required to run it with root permission.
