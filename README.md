# ckb-time-generator

The generator of [ckb-time-scripts](https://github.com/DeAccountSystems/ckb-time-script).


## How to Work

- Clone and install every dependencies.
- Copy `config/default.ts` to `config/local.ts`, edit configs as needed.
- Build with `npm run build`, each time you update `config/local.ts` it is needed to rebuild.
- Run with `npm run reload_testnet` or `npm run reload_production` base on environment.


## Tool Commands

- `npm run main -- status -t timestamp` check status of TimeCells and their IndexStateCell on-chain.
- `npm run main -- fix -t timestamp` recycle redundant TimeCells and their IndexStateCell on-chain.
- `npm run main -- update -t timestamp` keep updating TimeCells and their IndexStateCell on-chain.

Same as `timestamp` other option of `-t` can be `blocknumber` and `quote`, for more help information, please try `npm run main -- --help` .
