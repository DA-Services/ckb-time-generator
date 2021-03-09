# ckb-time-generator

The generator of [ckb-time-scripts](https://github.com/nervina-labs/ckb-time-scripts).

### How to Work

```shell
git clone https://github.com/duanyytop/ckb-time-generator.git
cd ckb-time-generator
mv .env.example .env
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
