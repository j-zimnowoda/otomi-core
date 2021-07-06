import { Argv } from 'yargs'
import { $ } from 'zx'
import { OtomiDebugger, terminal } from '../common/debug'
import { BasicArguments, ENV } from '../common/no-deps'
import { cleanupHandler, otomi, PrepareEnvironmentOptions } from '../common/setup'

type Arguments = BasicArguments

const fileName = 'kind'
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

function guidGenerator() {
  const S4 = function () {
    // eslint-disable-next-line no-bitwise
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  }
  return `${S4() + S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`
}

export const kind = async (argv: Arguments, options?: PrepareEnvironmentOptions): Promise<void> => {
  await setup(argv, options)

  const buildID = guidGenerator()
  const tags = ['v1.19.0']
  const KUBECONFIG = `$HOME/.kube/configs/${buildID}`

  await $`curl -sSL https://get.docker.com/ | sh`
  await $`export KUBECONFIG=${KUBECONFIG}`
  await $`kind create cluster --wait 30s --name=${buildID} --image=kindest/node:${tags[0]}`
  await $`kind delete cluster --name=${buildID}`
}

export const module = {
  command: fileName,
  describe: 'kind',
  builder: (parser: Argv): Argv => parser,

  handler: async (argv: Arguments): Promise<void> => {
    ENV.PARSED_ARGS = argv
    await kind(argv, {})
  },
}

export default module
