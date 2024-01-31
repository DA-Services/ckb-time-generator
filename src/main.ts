#!/usr/bin/env node

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { statusController } from './controller/status'
import { fixController } from './controller/fix'
import { createController } from './controller/create'
import { updateController } from './controller/update'
import { statusOfExchangesController } from './controller/status-of-exchanges'
import { testLark } from './controller/test-lark'

// import config from './config'
// console.log('config:', config)
// process.exit(1)

yargs(hideBin(process.argv))
  .usage('Usage: $0 <command> [options]')
  .command('status', 'Check IndexStateCells and InfoCells status on blockchain.', (yargs) => {
    return yargs
      .option('type', { alias: 't', desc: 'Type of cell', required: true, choices: ['timestamp', 'blocknumber', 'quote'] })
      .example('$0 --type timestamp', 'Check status of TimeCells.')
  }, statusController)
  .command('status-of-exchanges', 'Check the status of exchanges API.', (yargs) => {
    return yargs
  }, statusOfExchangesController)
  .command('test-lark', 'Check the status of Lark API.', (yargs) => {
    return yargs
  }, testLark)
  // TODO Fix this command, it is a index signature error cause the codes can not pass compiling.
  // .command('fix', 'Recycle redundant IndexStateCells and InfoCells on blockchain.', (yargs) => {
  //   return yargs
  //     .option('type', { alias: 't', desc: 'Type of cell', required: true, choices: ['timestamp', 'blocknumber', 'quote']})
  //     .option('dry-run', { alias: 'd', desc: 'Run fix command once to see if the result is expected.', default: false, boolean: true })
  //     .example('$0 --type timestamp', 'Recycle redundant TimeCells and their IndexStateCells.')
  // }, fixController)
  .command('create', 'Create required IndexStateCells and InfoCells on requirement.', (yargs) => {
    return yargs
      .option('type', { alias: 't', desc: 'Type of cell', required: true, choices: ['timestamp', 'blocknumber', 'quote'] })
      .example('$0 --type timestamp', 'Create TimeCells and their IndexStateCells.')
  }, createController)
  .command('update', 'Keep updating IndexStateCells and InfoCells.', (yargs) => {
    return yargs
      .option('type', { alias: 't', desc: 'Type of cell', required: true, choices: ['timestamp', 'blocknumber', 'quote'] })
      .example('$0 --type timestamp', 'Keep updating TimeCells and their IndexStateCells.')
  }, updateController)
  .help().alias('h', 'help')
  .alias('v', 'version')
  .strict(true)
  .recommendCommands()
  .demandCommand()
  .argv
