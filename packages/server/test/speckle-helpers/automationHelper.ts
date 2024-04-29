/* eslint-disable camelcase */
import {
  getAutomation,
  storeAutomation,
  storeAutomationRevision
} from '@/modules/automate/repositories/automations'
import {
  createAutomation,
  createAutomationRevision
} from '@/modules/automate/services/automationManagement'
import { createStoredAuthCode } from '@/modules/automate/services/executionEngine'
import { createInmemoryRedisClient } from '@/test/redisHelper'
import cryptoRandomString from 'crypto-random-string'
import {
  createAutomation as clientCreateAutomation,
  createFunction
} from '@/modules/automate/clients/executionEngine'
import { getBranchesByIds } from '@/modules/core/repositories/branches'
import {
  generateFunctionId,
  getFunctionReleases,
  upsertFunction,
  upsertFunctionToken,
  updateFunction as updateDbFunction,
  getFunction,
  getFunctionByExecEngineId,
  getFunctionToken,
  insertFunctionRelease
} from '@/modules/automate/repositories/functions'
import { getValidatedUserAuthMetadata } from '@/modules/core/services/githubApp'
import {
  GithubCreateRepoFromTemplateData,
  OAuthAppAuthentication,
  createRepoFromTemplate,
  encryptSecret
} from '@/modules/core/clients/github'
import {
  CreateFunctionReleaseDeps,
  FunctionReleaseCreateBody,
  createFunctionFromTemplate,
  createFunctionRelease,
  updateFunction
} from '@/modules/automate/services/functionManagement'
import { createAutomateRepoFromTemplate } from '@/modules/automate/services/github'
import { getUser } from '@/modules/core/repositories/users'
import {
  AutomateFunctionTemplateLanguage,
  CreateAutomateFunctionInput
} from '@/modules/core/graph/generated/graphql'
import { SourceAppNames } from '@speckle/shared'
import { Request } from 'express'
import { isFunction } from 'lodash'

export const buildAutomationCreate = (
  overrides?: Partial<{
    createDbAutomation: typeof clientCreateAutomation
  }>
) => {
  const create = createAutomation({
    createAuthCode: createStoredAuthCode({ redis: createInmemoryRedisClient() }),
    automateCreateAutomation:
      overrides?.createDbAutomation ||
      (async () => ({
        automationId: cryptoRandomString({ length: 10 }),
        automationToken: cryptoRandomString({ length: 10 })
      })),
    storeAutomation
  })

  return create
}

export const buildAutomationRevisionCreate = () => {
  const create = createAutomationRevision({
    getAutomation,
    storeAutomationRevision,
    getBranchesByIds,
    getFunctionReleases
  })

  return create
}

export const buildCreateFn = (
  overrides?: Partial<{
    getValidatedGithubAuthMetadata: ReturnType<typeof getValidatedUserAuthMetadata>
    createRepoFromTemplate: typeof createRepoFromTemplate
    createExecutionEngineFn: typeof createFunction
  }>
) => {
  const getValidatedGithubAuthMetadata =
    overrides?.getValidatedGithubAuthMetadata ||
    (async (): Promise<OAuthAppAuthentication> => ({
      token: 'a',
      scopes: ['b', 'c'],
      clientType: 'oauth-app',
      clientId: 'd',
      clientSecret: 'e',
      tokenType: 'oauth',
      type: 'token'
    }))

  const create = createFunctionFromTemplate({
    createGithubRepo: createAutomateRepoFromTemplate({
      getValidatedGithubAuthMetadata,
      createRepoFromTemplate:
        overrides?.createRepoFromTemplate ||
        (async () =>
          ({
            id: '123',
            name: 'speckle-server',
            full_name: 'specklesystems/speckle-server',
            html_url: 'https://github.com/specklesystems/speckle-server',
            ssh_url: 'git@github.com:specklesystems/speckle-server.git'
          } as unknown as GithubCreateRepoFromTemplateData))
    }),
    upsertFn: upsertFunction,
    createExecutionEngineFn:
      overrides?.createExecutionEngineFn ||
      (async () => ({
        functionId: generateFunctionId(),
        token: 'aaaaa'
      })),
    generateAuthCode: async () => 'test-auth-code',
    getValidatedGithubAuthMetadata,
    getGithubRepoPublicKey: async () => ({
      key_id: '3380204578043523366',
      key: 'enDLkz8Llm+QHwTL3CwMdzhxoUpAZj3S5mJKWmyBi1A='
    }),
    encryptGithubSecret: encryptSecret,
    upsertGithubSecret: async () => true,
    insertGithubEnvVar: async () => true,
    getUser,
    generateFunctionId,
    upsertFunctionToken
  })

  return create
}

export const buildUpdateFn = () => {
  const update = updateFunction({
    updateFunction: updateDbFunction,
    getFunction
  })

  return update
}

const buildFakeReq = (): Request =>
  ({
    params: {},
    body: {},
    headers: {},
    cookies: {}
  } as Request)

export const buildCreateFunctionReleaseFn = (
  resolveFunctionParams: CreateFunctionReleaseDeps['resolveFunctionParams']
) => {
  const create = createFunctionRelease({
    resolveFunctionParams,
    getFunctionByExecEngineId,
    getFunctionToken,
    insertFunctionRelease
  })

  return async (params?: { req?: Request | ((baseReq: Request) => Request) }) =>
    await create({
      req: params?.req
        ? isFunction(params.req)
          ? params.req(buildFakeReq())
          : params.req
        : buildFakeReq()
    })
}

export const exampleCreationInput = (): CreateAutomateFunctionInput => ({
  template: AutomateFunctionTemplateLanguage.Python,
  name: 'test-fn',
  description: 'test description',
  logo: 'https://example.com/logo.png',
  supportedSourceApps: [SourceAppNames[0]],
  tags: ['tag1', 'tag2']
})

export const exampleFunctionReleaseCreateBody = (): FunctionReleaseCreateBody => ({
  commitId: '62f55086bd',
  versionTag: '123.45.67',
  inputSchema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://example.com/product.schema.json',
    title: 'Product',
    description: "A product from Acme's catalog",
    type: 'object',
    properties: {
      productId: {
        description: 'The unique identifier for a product',
        type: 'integer'
      }
    },
    required: ['productId']
  },
  command: ['python', 'main.py'],
  recommendedCPUm: 1000,
  recommendedMemoryMi: 1000
})

export const createTestFunction = async (params: {
  userId: string
  fn?: Partial<CreateAutomateFunctionInput>
  fnRelease?: Partial<FunctionReleaseCreateBody>
}) => {
  const { userId, fn, fnRelease } = params

  const createFn = buildCreateFn()
  const fnInput: CreateAutomateFunctionInput = {
    ...exampleCreationInput(),
    ...(fn || {})
  }
  const newFn = await createFn({ input: fnInput, userId })

  const createRelease = buildCreateFunctionReleaseFn(() => ({
    functionId: newFn.fn.executionEngineFunctionId,
    token: newFn.token.token
  }))
  const release = await createRelease({
    req: (req) => {
      req.body = {
        ...exampleFunctionReleaseCreateBody(),
        ...(fnRelease || {})
      }
      return req
    }
  })

  return {
    function: newFn,
    release
  }
}
