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

- `npm run main -- status -t timestamp` check status of TimeCells and their IndexStateCell on-chain.
- `npm run main -- fix -t timestamp` recycle redundant TimeCells and their IndexStateCell on-chain.
- `npm run main -- update -t timestamp` keep updating TimeCells and their IndexStateCell on-chain.

Same as `timestamp` other option of `-t` can be `blocknumber` and `quote`, for more help information, please try `npm run main -- --help` .


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
npm run dev -- {sub commands}
```

The `dev` script will load `config/local-testnet.ts` and `config/testnet.ts` by default.
