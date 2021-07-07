import { Argv, Options } from 'yargs'
import { $ } from 'zx'
import { OtomiDebugger, terminal } from '../common/debug'
import { BasicArguments, ENV } from '../common/no-deps'
import { cleanupHandler, otomi, PrepareEnvironmentOptions } from '../common/setup'
import { deployAll } from './apply'

interface Arguments extends BasicArguments {
  'delete-cluster'?: boolean
}

const kindOptions: { [key: string]: Options } = {
  'delete-cluster': {
    describe: 'Determines whether the KinD cluster is automatically cleaned up.',
    nargs: 1,
  },
}

const fileName = 'kind'
let debug: OtomiDebugger
const buildID = Date.now()

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

export const kind = async (argv: Arguments, options?: PrepareEnvironmentOptions): Promise<void> => {
  await setup(argv, options)

  const tags = ['v1.19.0']
  process.env.KUBECONFIG = `${process.env.HOME}/.kube/${buildID}`

  await $`kind create cluster --wait 30s --name=${buildID} --image=kindest/node:${tags[0]}`
  process.env.isCI = 'true'
  deployAll({ ...argv, dryRun: false, d: false, 'dry-run': false })

  if (argv.deleteCluster) await $`kind delete cluster --name=${buildID}`
}

export const module = {
  command: fileName,
  describe: 'kind, test-system',
  builder: (parser: Argv): Argv => parser.options(kindOptions),

  handler: async (argv: Arguments): Promise<void> => {
    ENV.PARSED_ARGS = argv
    await kind(argv, {
      skipKubeContextCheck: true,
    })
  },
}

export default module
