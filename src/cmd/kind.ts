import { Argv } from 'yargs'
import { $ } from 'zx'
import { OtomiDebugger, terminal } from '../common/debug'
import { BasicArguments, ENV } from '../common/no-deps'
import { cleanupHandler, otomi, PrepareEnvironmentOptions } from '../common/setup'
import { apply } from './apply'

type Arguments = BasicArguments

const fileName = 'kind'
let debug: OtomiDebugger
const now = Date.now()

/* eslint-disable no-useless-return */
const cleanup = async (argv: Arguments): Promise<void> => {
  if (argv['skip-cleanup']) return
  await $`kind delete cluster --name=${now}`
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
  process.env.KUBECONFIG = `${process.env.HOME}/.kube/configs/${now}`

  await $`kind create cluster --wait 30s --name=${now} --image=kindest/node:${tags[0]}`

  apply({ ...argv, dryRun: false, d: false, 'dry-run': false }, { skipAll: true })
}

export const module = {
  command: fileName,
  describe: 'kind',
  builder: (parser: Argv): Argv => parser,

  handler: async (argv: Arguments): Promise<void> => {
    ENV.PARSED_ARGS = argv
    await kind(argv, {
      skipKubeContextCheck: true,
    })
  },
}

export default module
