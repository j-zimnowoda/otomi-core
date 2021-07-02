import { Argv } from 'yargs'
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

export const kind = async (argv: Arguments, options?: PrepareEnvironmentOptions): Promise<void> => {
  await setup(argv, options)

  debug.log(fileName)
  debug.log(argv)
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
