import { Argv, Options } from 'yargs'
import { $ } from 'zx'
import { env } from '../common/envalid'
import { cleanupHandler } from '../common/setup'
import { BasicArguments, OtomiDebugger, setParsedArgs, terminal } from '../common/utils'

interface Arguments extends BasicArguments {
  deleteCluster: boolean
  noDeploy: boolean
  wait: string
}

const kindOptions: { [key: string]: Options } = {
  'delete-cluster': {
    alias: 'dc',
    describe: 'Delete the cluster after running the test suite.',
    default: true,
    type: 'boolean',
  },
  'no-deploy': {
    alias: 'nd',
    describe: 'Create the cluster without running the test suite.',
    default: false,
    type: 'boolean',
  },
  wait: {
    alias: 'w',
    describe: 'Wait for the cluster to be ready before running the test suite.',
    default: '60s',
    type: 'string',
  },
}

const fileName = 'kind'
let debug: OtomiDebugger
const tags = ['v1.19.0']
const name = 'kind-config-otomi'
process.env.KUBECONFIG = `${process.env.HOME}/.kube/${name}`
process.env.CI = 'true'

/* eslint-disable no-useless-return */
const cleanup = (argv: Arguments): void => {
  if (argv.skipCleanup) return
}

/* eslint-enable no-useless-return */
const setup = async (argv: Arguments): Promise<void> => {
  await $`mkdir -p ~/.kube && touch ${env.KUBECONFIG} && chmod +r ${env.KUBECONFIG}`

  if (argv._[0] === fileName) cleanupHandler(() => cleanup(argv))
  debug = terminal(fileName)
}

export const kind = async (argv: Arguments): Promise<void> => {
  await setup(argv)

  await $`kind create cluster --wait ${argv.wait} \
  --name ${name} \
  --kubeconfig ${env.KUBECONFIG} \
  --image kindest/node:${tags[0]} \
  --config=kind-config.yaml`

  if (!argv.noDeploy) {
    try {
      await $`bin/deploy.sh`
    } catch (e) {
      debug.log(e)
    }
  }
  if (argv.deleteCluster) await $`kind delete cluster --name ${name}`
}

export const module = {
  command: fileName,
  describe: 'kind, test-system',
  builder: (parser: Argv): Argv => parser.options(kindOptions),

  handler: async (argv: Arguments): Promise<void> => {
    setParsedArgs(argv)
    await kind(argv)
  },
}

export default module
