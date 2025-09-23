import type { ApiTokenRecord } from '@/modules/auth/repositories'
import { LogicError } from '@/modules/shared/errors'
import type { SavedViewGroupApiTokenRecord } from '@/modules/viewer/domain/types/savedViewGroupApiTokens'
import { createSavedViewGroupTokenFactory } from '@/modules/viewer/services/tokens'
import {
  SavedViewGroupNotFoundError,
  SavedViewGroupResourcelessError
} from '@speckle/shared/authz'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('createSavedViewGroupTokenFactory returns a function, that', () => {
  const savedViewGroupId = cryptoRandomString({ length: 9 })
  const projectId = cryptoRandomString({ length: 9 })
  const userId = cryptoRandomString({ length: 9 })

  it('returns a token associated with the given dashboard', async () => {
    let token
    const createSavedViewGroupToken = createSavedViewGroupTokenFactory({
      getSavedViewGroup: async () => ({
        id: cryptoRandomString({ length: 10 }),
        projectId,
        name: null,
        authorId: null,
        resourceIds: [cryptoRandomString({ length: 10 })]
      }),
      createToken: async () => ({
        id: cryptoRandomString({ length: 10 }),
        token: cryptoRandomString({ length: 20 })
      }),
      getToken: async () => ({} as ApiTokenRecord),
      storeSavedViewGroupApiToken: async (svgt) => {
        token = svgt
        return svgt
      }
    })

    const result = await createSavedViewGroupToken({
      savedViewGroupId,
      projectId,
      userId
    })

    expect(result.tokenMetadata.projectId).to.equal(projectId)
    expect(token).to.not.be.undefined
  })

  it('throws NotFound if savedViewGroup is not found', async () => {
    const createSavedViewGroupToken = createSavedViewGroupTokenFactory({
      getSavedViewGroup: async () => null,
      createToken: async () => ({
        id: cryptoRandomString({ length: 10 }),
        token: cryptoRandomString({ length: 20 })
      }),
      getToken: async () => ({} as ApiTokenRecord),
      storeSavedViewGroupApiToken: async () => ({} as SavedViewGroupApiTokenRecord)
    })

    const promise = createSavedViewGroupToken({ projectId, savedViewGroupId, userId })

    expect(promise).to.eventually.throw(SavedViewGroupNotFoundError)
  })

  it('throws Resourceless if savedViewGroup does not contain resources', async () => {
    const createSavedViewGroupToken = createSavedViewGroupTokenFactory({
      getSavedViewGroup: async () => ({
        id: cryptoRandomString({ length: 10 }),
        projectId,
        name: null,
        authorId: null,
        resourceIds: [] // no resources
      }),
      createToken: async () => ({
        id: cryptoRandomString({ length: 10 }),
        token: cryptoRandomString({ length: 20 })
      }),
      getToken: async () => ({} as ApiTokenRecord),
      storeSavedViewGroupApiToken: async () => ({} as SavedViewGroupApiTokenRecord)
    })

    const promise = createSavedViewGroupToken({ projectId, savedViewGroupId, userId })

    expect(promise).to.eventually.throw(SavedViewGroupResourcelessError)
  })

  it('throws LogicError if savedViewGroup belongs to another project', async () => {
    const createSavedViewGroupToken = createSavedViewGroupTokenFactory({
      getSavedViewGroup: async () => ({
        id: cryptoRandomString({ length: 10 }),
        projectId: cryptoRandomString({ length: 10 }), // wrong project
        name: null,
        authorId: null,
        resourceIds: [cryptoRandomString({ length: 10 })]
      }),
      createToken: async () => ({
        id: cryptoRandomString({ length: 10 }),
        token: cryptoRandomString({ length: 20 })
      }),
      getToken: async () => ({} as ApiTokenRecord),
      storeSavedViewGroupApiToken: async () => ({} as SavedViewGroupApiTokenRecord)
    })

    const promise = createSavedViewGroupToken({ projectId, savedViewGroupId, userId })

    expect(promise).to.eventually.throw(LogicError)
  })
})
