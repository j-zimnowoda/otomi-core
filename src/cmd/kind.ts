import { Argv, Options } from 'yargs'
import { $ } from 'zx'
import { OtomiDebugger, terminal } from '../common/debug'
import { BasicArguments, ENV } from '../common/no-deps'
import { cleanupHandler, otomi, PrepareEnvironmentOptions } from '../common/setup'

interface Arguments extends BasicArguments {
  'delete-cluster': boolean
  'no-deploy': boolean
  wait: string
}

const kindOptions: { [key: string]: Options } = {
  'delete-cluster': {
    describe: 'Delete the cluster after running the test suite.',
    default: true,
    type: 'boolean',
  },
  'no-deploy': {
    describe: 'Create the cluster without running the test suite.',
    default: false,
    type: 'boolean',
  },
  wait: {
    alias: 'w',
    describe: 'Wait for the cluster to be ready before running the test suite.',
    default: '0s',
    type: 'string',
  },
}

const fileName = 'kind'
let debug: OtomiDebugger
const tags = ['v1.19.0']
const name = 'otomi-system'
process.env.KUBECONFIG = `${process.env.HOME}/.kube/${name}`
process.env.isCI = 'true'

/* eslint-disable no-useless-return */
const cleanup = (argv: Arguments): void => {
  if (argv['skip-cleanup']) return
}

/* eslint-enable no-useless-return */
const setup = async (argv: Arguments, options?: PrepareEnvironmentOptions): Promise<void> => {
  await $`touch ${ENV.KUBECONFIG} && chmod 600 ${ENV.KUBECONFIG}`

  if (argv._[0] === fileName) cleanupHandler(() => cleanup(argv))
  debug = terminal(fileName)

  if (options) await otomi.prepareEnvironment(debug, options)
}

export const kind = async (argv: Arguments, options?: PrepareEnvironmentOptions): Promise<void> => {
  await setup(argv, options)

  await $`kind create cluster --wait ${argv.wait} --name ${name} --kubeconfig ${ENV.KUBECONFIG} --image kindest/node:${tags[0]}`

  if (!argv['no-deploy']) {
    try {
      await $`bin/deploy.sh`
    } catch (e) {
      debug.log(e)
    }
  }
  if (argv['delete-cluster']) await $`kind delete cluster --name ${name}`
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
