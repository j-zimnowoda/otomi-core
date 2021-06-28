import { EventEmitter } from 'events'
import { existsSync, writeFileSync } from 'fs'
import { $, cd, ProcessOutput } from 'zx'
import { OtomiDebugger, terminal } from './debug'
import { BasicArguments, ENV, parser, readdirRecurse } from './no-deps'
import { evaluateSecrets } from './secrets'

EventEmitter.defaultMaxListeners = 20

let term: OtomiDebugger
const debug = (): OtomiDebugger => {
  if (term) return term
  term = terminal('crypt')
  return term
}
enum CRYPT_TYPE {
  ENCRYPT = 'enc', // 'sops -e',
  DECRYPT = 'dec', // 'sops --input-type=yaml --output-type yaml -d $1',
}

const preCrypt = async (): Promise<void> => {
  debug().verbose('Pre Crypt')
  await evaluateSecrets(debug())
  if (process.env.GCLOUD_SERVICE_KEY) {
    debug().verbose('Writing GOOGLE_APPLICATION_CREDENTIAL')
    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/key.json'
    writeFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, process.env.GCLOUD_SERVICE_KEY.trim())
  }
}

const postCrypt = (): void => {
  debug().verbose('Post Crypt')
  process.env.GOOGLE_APPLICATION_CREDENTIALS = undefined
}

const runOnSecretFiles = async (cmd: string[], filesArgs?: string[]): Promise<ProcessOutput[] | undefined> => {
  const currDir = (await $`pwd`).stdout.trim()
  let files: string[] = filesArgs ?? []
  cd(`${ENV.DIR}`)

  if (files.length === 0) {
    files = await readdirRecurse(`${ENV.DIR}/env`)
    files = files
      .filter((file) => file.endsWith('.yaml') && file.includes('/secrets.'))
      .map((file) => file.replace(ENV.DIR, '.'))
    files = files.filter((file) => existsSync(`${ENV.DIR}/${file}`))
  }
  await preCrypt()

  const eventEmitterDefaultListeners = EventEmitter.defaultMaxListeners
  EventEmitter.defaultMaxListeners = files.length + 5
  try {
    const commands = files.map(async (file) => $`${cmd} ${file}`)
    return await Promise.all(commands)
  } catch (error) {
    debug().error(error)
    return undefined
  } finally {
    cd(currDir)
    postCrypt()
    EventEmitter.defaultMaxListeners = eventEmitterDefaultListeners
  }
}

const crypt = async (type: CRYPT_TYPE, ...files: string[]): Promise<ProcessOutput[] | void> => {
  const helmArgs = ['helm', 'secrets', type]
  const res = (await runOnSecretFiles(helmArgs, files))?.map((result) => result.stdout.trim())
  debug().verbose(`Running crypt type ${type}`)
  res?.map((result) => debug().debug(result))
}

export const decrypt = async (baseDebug?: OtomiDebugger, ...files: string[]): Promise<void> => {
  term = terminal('crypt', baseDebug as OtomiDebugger)
  await crypt(CRYPT_TYPE.DECRYPT, ...files)
}
export const encrypt = async (baseDebug?: OtomiDebugger, ...files: string[]): Promise<void> => {
  term = terminal('crypt', baseDebug as OtomiDebugger)
  await crypt(CRYPT_TYPE.ENCRYPT, ...files)
}

export const rotate = async (baseDebug?: OtomiDebugger): Promise<void> => {
  term = terminal('rotate', baseDebug as OtomiDebugger)
  const verboseArg = (parser.argv as BasicArguments).verbose >= 1 ? ['--verbose'] : []
  const sopsArgs = ['sops', ...verboseArg, '--input-type=yaml', '--output-type=yaml', '-i', '-r']

  const res = (await runOnSecretFiles(sopsArgs))?.map((result) => result.stderr)
  if (verboseArg.length > 0) res?.map((result) => debug().verbose(result))
}
