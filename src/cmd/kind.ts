import { Argv, Options } from 'yargs'
import { $ } from 'zx'
import { OtomiDebugger, terminal } from '../common/debug'
import { BasicArguments, ENV } from '../common/no-deps'
import { cleanupHandler, otomi, PrepareEnvironmentOptions } from '../common/setup'

interface Arguments extends BasicArguments {
  'delete-cluster'?: boolean
  'no-deploy'?: boolean
}

const kindOptions: { [key: string]: Options } = {
  'delete-cluster': {
    describe: 'Delete the cluster after running the test suite.',
  },
  'no-deploy': {
    describe: 'Create the cluster without running the test suite.',
  },
}

const fileName = 'kind'
let debug: OtomiDebugger
const buildID = Date.now()
const tags = ['v1.19.0']
const context = `k8s-${tags[0]}-${buildID}`
process.env.KUBECONFIG = `${process.env.HOME}/.kube/${context}`
process.env.isCI = 'true'

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
  await $`touch ${ENV.KUBECONFIG}`
  await setup(argv, options)

  await $`kind create cluster --wait 30s --name ${context} --kubeconfig ${ENV.KUBECONFIG} --image kindest/node:${tags[0]}`
  await $`kubectl cluster-info --context kind-${context} --kubeconfig ${ENV.KUBECONFIG}`

  if (!argv['no-deploy']) {
    try {
      await $`bin/deploy.sh`
    } catch (e) {
      debug.log(e)
    }
  }

  if (argv.deleteCluster) await $`kind delete cluster --name=${context}`
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
