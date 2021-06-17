# ckb-time-generator

The generator of [ckb-time-scripts](https://github.com/nervina-labs/ckb-time-scripts).

### How to Work

```shell
git clone https://github.com/duanyytop/ckb-time-generator.git
cd ckb-time-generator
```

- Edit .env file

You need to copy `.env` file from `.env.example` and input ckb node url and ckb indexer url.

- Installation

```shell
yarn install
```

- Running

```shell
yarn start
```

### Information on Aggron

The time info type script of timestamp and block number on Aggron can be found [wiki#type-script](https://github.com/duanyytop/ckb-time-generator/wiki/Time-info-type-script-on-Aggron).

The transactions of timestamp and block number on Aggron can be found [wiki#transactions](https://github.com/duanyytop/ckb-time-generator/wiki/Time-info-transctions-on-Aggron).

### Files Structure
```shell
ckb-time-generator/
  | config/                   # config directory
  |   default.ts              # default config
  |   blocknumber.ts          # config for blocknumber
  |   timestamp.ts
  |   quote.ts
  | src/
  |   logic/
  |     create.ts             # create cells when first start
  |     update.ts             # update info & index cell when necessary
  |     server.ts             # a server controls when to create or update
  |   model/
  |     index_state_model.ts  # a abstraction for index state cell
  |     info_model.ts         # a abstraction for info cell
  |   utils/
  |     ...
  |   config.ts               # used to load config from `config/` and add type information 
  |   start-block.ts          # start block cell server
  |   start-quote.ts          # start quote cell server
  |   start-time.ts
```
