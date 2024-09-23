import { getAutomateEncryptionKeysPath } from '@/modules/shared/helpers/envHelper'
import { packageRoot } from '@/bootstrap'
import path from 'node:path'
import fs from 'node:fs/promises'
import { has, isArray, isObjectLike } from 'lodash'
import { Nullable, Optional } from '@speckle/shared'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { AutomationFunctionInputEncryptionError } from '@/modules/automate/errors/management'
import { KeyPair, buildDecryptor } from '@/modules/shared/utils/libsodium'
import { AutomateRevisionFunctionRecord } from '@/modules/automate/helpers/types'
import { AutomationRevisionFunctionGraphQLReturn } from '@/modules/automate/helpers/graphTypes'
import { FunctionReleaseSchemaType } from '@/modules/automate/helpers/executionEngine'
import { LibsodiumEncryptionError } from '@/modules/shared/errors/encryption'
import { Merge } from 'type-fest'
import { convertFunctionReleaseToGraphQLReturn } from '@/modules/automate/services/functionManagement'
import { redactWriteOnlyInputData } from '@/modules/automate/utils/jsonSchemaRedactor'
import {
  GetEncryptionKeyPair,
  GetEncryptionKeyPairFor
} from '@/modules/automate/domain/operations'

type KeysFileContents = Array<KeyPair>

let keys: Optional<KeysFileContents> = undefined

const isKeysFileContents = (
  fileContents: unknown
): fileContents is KeysFileContents => {
  return (
    isArray(fileContents) &&
    fileContents.length > 0 &&
    fileContents.every((entry) => has(entry, 'publicKey') && has(entry, 'privateKey'))
  )
}

const getEncryptionKeys = async () => {
  if (keys) return keys

  const relativePath = getAutomateEncryptionKeysPath()
  const fullPath = path.resolve(packageRoot, relativePath)
  const file = await fs.readFile(fullPath, 'utf-8')

  const parsedJson = JSON.parse(file)
  const keysFileContents = isKeysFileContents(parsedJson) ? parsedJson : null
  if (!keysFileContents)
    throw new MisconfiguredEnvironmentError('Invalid encryption keys file format')

  keys = keysFileContents
  return keys
}

export const getEncryptionKeyPair: GetEncryptionKeyPair = async () => {
  return (await getEncryptionKeys())[0]
}

export const getEncryptionPublicKey = async () => {
  return (await getEncryptionKeyPair()).publicKey
}

export const getEncryptionKeyPairFor: GetEncryptionKeyPairFor = async (
  publicKey: string
) => {
  const keyPairs = await getEncryptionKeys()
  const keyPair = keyPairs.find((keyPair) => keyPair.publicKey === publicKey)
  if (!keyPair) {
    throw new MisconfiguredEnvironmentError(
      'Environment does not have a key pair for the requested public key',
      {
        info: { publicKey }
      }
    )
  }

  return keyPair
}

const isValidInputObject = (
  input: unknown
): input is Nullable<Record<string, unknown>> => {
  return input === null || (!isArray(input) && isObjectLike(input))
}

export type GetFunctionInputDecryptorDeps = {
  buildDecryptor: typeof buildDecryptor
}

export const getFunctionInputDecryptorFactory =
  (deps: GetFunctionInputDecryptorDeps) => async (params: { keyPair: KeyPair }) => {
    const { buildDecryptor } = deps
    const { keyPair } = params

    const coreDecryptor = await buildDecryptor(keyPair)

    const decryptInputs = async (data: Nullable<string>) => {
      if (data === null) return null

      const decryptedString = await coreDecryptor.decrypt(data)
      const inputsObject = JSON.parse(decryptedString)
      if (!isValidInputObject(inputsObject)) {
        throw new AutomationFunctionInputEncryptionError(
          'Decrypted input is not a valid inputs object'
        )
      }

      return inputsObject
    }

    return {
      decryptInputs,
      dispose: coreDecryptor.dispose
    }
  }
export type FunctionInputDecryptor = ReturnType<typeof getFunctionInputDecryptorFactory>

export type GetFunctionInputsForFrontendDeps = {
  getEncryptionKeyPairFor: GetEncryptionKeyPairFor
  redactWriteOnlyInputData: typeof redactWriteOnlyInputData
} & GetFunctionInputDecryptorDeps

export type AutomationRevisionFunctionForInputRedaction = Merge<
  AutomateRevisionFunctionRecord,
  { release: FunctionReleaseSchemaType }
>

export const getFunctionInputsForFrontendFactory =
  (deps: GetFunctionInputsForFrontendDeps) =>
  async (params: {
    fns: Array<AutomationRevisionFunctionForInputRedaction>
    publicKey: string
  }) => {
    const { getEncryptionKeyPairFor, redactWriteOnlyInputData } = deps
    const { fns, publicKey } = params

    const keyPair = await getEncryptionKeyPairFor(publicKey)
    const inputDecryptor = await getFunctionInputDecryptorFactory(deps)({ keyPair })

    let results: AutomationRevisionFunctionGraphQLReturn[] = []
    try {
      results = await Promise.all(
        fns.map(async (fn) => {
          let inputs = await inputDecryptor.decryptInputs(fn.functionInputs)
          const schema = fn.release.inputSchema

          if (schema || inputs) {
            inputs = redactWriteOnlyInputData(inputs, schema)
          }

          return {
            ...fn,
            functionInputs: inputs,
            release: convertFunctionReleaseToGraphQLReturn({
              ...fn.release,
              functionId: fn.functionId
            })
          }
        })
      )
    } catch (e) {
      if (e instanceof AutomationFunctionInputEncryptionError) {
        throw new AutomationFunctionInputEncryptionError(
          'One or more function inputs are not proper input objects',
          { cause: e }
        )
      }

      if (e instanceof LibsodiumEncryptionError) {
        throw new AutomationFunctionInputEncryptionError(
          'Failed to decrypt one or more function inputs, they might not have been properly encrypted',
          { cause: e }
        )
      }

      throw e
    } finally {
      inputDecryptor.dispose()
    }

    return results
  }
