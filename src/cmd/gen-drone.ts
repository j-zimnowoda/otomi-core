import { readFileSync, writeFileSync } from 'fs'
import { Argv } from 'yargs'
import {
  BasicArguments,
  cleanupHandler,
  ENV,
  hfValues,
  otomi,
  OtomiDebugger,
  PrepareEnvironmentOptions,
  terminal,
} from '../common/index'

export interface Arguments extends BasicArguments {
  dryRun: number
  d: number
  'dry-run': number
}

const fileName = 'gen-drone'
let debug: OtomiDebugger

/* eslint-disable no-useless-return */
const cleanup = (argv: Arguments): void => {
  if (argv['skip-cleanup']) return
}
/* eslint-enable no-useless-return */

const setup = async (argv: Arguments, options?: PrepareEnvironmentOptions): Promise<void> => {
  if (argv._[0] === fileName) cleanupHandler(() => cleanup(argv))
  debug = terminal(fileName)

  if (options) await otomi.prepareEnvironment(debug, options)
}

export const genDrone = async (argv: Arguments, options?: PrepareEnvironmentOptions): Promise<void> => {
  await setup(argv, options)
  const hfVals = await hfValues()

  const receiver = hfVals.alerts?.drone ?? 'slack'
  const branch = hfVals.charts?.['otomi-api']?.git?.branch ?? 'main'

  const key = receiver === 'slack' ? 'url' : 'lowPrio'
  const channel = receiver === 'slack' ? hfVals.alerts?.[receiver]?.channel ?? 'dev-mon' : undefined

  const webhook = hfVals.alerts?.[receiver]?.[key]
  if (!webhook) throw new Error(`Could not find webhook url in 'alerts.${receiver}.${key}'`)

  const cluster = hfVals.cluster?.name

  const template: string = readFileSync(`${process.env.PWD}/tpl/.drone.tpl.${receiver}.yml`, 'utf-8')
  const output = template
    .replaceAll('__CLUSTER', cluster)
    .replaceAll('__IMAGE_TAG', otomi.imageTag())
    .replaceAll('__WEBHOOK', webhook)
    .replaceAll('__CUSTOMER', otomi.customerName())
    .replaceAll('__BRANCH', branch)
    .replaceAll('__CHANNEL', channel)

  if (process.env.DRY_RUN || argv['dry-run'] > 0) {
    debug.log(output)
  } else {
    writeFileSync(`${ENV.DIR}/.drone.yaml`, output)
  }
}

export const module = {
  command: fileName,
  describe: '',
  builder: (parser: Argv): Argv =>
    parser.options({
      'dry-run': {
        alias: ['d'],
        describe: "Dry Run, don't write to file, but to STDOUT",
        group: 'otomi gen-drone options',
        count: true,
      },
    }),

  handler: async (argv: Arguments): Promise<void> => {
    await genDrone(argv, { skipKubeContextCheck: true })
  },
}

export default module
