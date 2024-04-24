import {
  getUserGithubAuthData,
  setUserGithubAuthData
} from '@/modules/automate/repositories/automations'
import { getAccessToken, testAccessToken } from '@/modules/core/clients/github'
import { AccessTokenTestError } from '@/modules/core/errors/github'

export type AuthorizeUserWithGithubAppDeps = {
  setUserGithubAuth: typeof setUserGithubAuthData
  getGithubAccessToken: typeof getAccessToken
  testGithubAccessToken: typeof testAccessToken
  env: {
    clientId: string
    clientSecret: string
  }
}

export const authorizeUserWithGithubApp =
  (deps: AuthorizeUserWithGithubAppDeps) =>
  async (params: { code: string; userId: string }) => {
    const {
      setUserGithubAuth,
      getGithubAccessToken,
      testGithubAccessToken,
      env: { clientId, clientSecret }
    } = deps
    const { code, userId } = params

    // Get access token
    const accessTokenData = await getGithubAccessToken({
      code,
      clientId,
      clientSecret
    })

    // Test access token
    const isValidToken = await testGithubAccessToken({
      accessToken: accessTokenData.token,
      clientId,
      clientSecret
    })
    if (!isValidToken) {
      throw new AccessTokenTestError()
    }

    // Save GH auth metadata to user record in DB
    await setUserGithubAuth({
      userId,
      authData: accessTokenData
    })

    return accessTokenData
  }

export type GetValidatedUserAuthMetadataDeps = {
  setUserGithubAuth: typeof setUserGithubAuthData
  getUserGithubAuth: typeof getUserGithubAuthData
  testGithubAccessToken: typeof testAccessToken
  env: {
    clientId: string
    clientSecret: string
  }
}

export const getValidatedUserAuthMetadata =
  (deps: GetValidatedUserAuthMetadataDeps) => async (params: { userId: string }) => {
    const {
      setUserGithubAuth,
      getUserGithubAuth,
      testGithubAccessToken,
      env: { clientId, clientSecret }
    } = deps
    const { userId } = params

    const invalidateUserAuthAndReturn = async () => {
      await setUserGithubAuth({
        userId,
        authData: null
      })
      return null
    }

    const authMetadata = await getUserGithubAuth(userId)
    if (!authMetadata || !Object.values(authMetadata).length) {
      return null
    }

    // Test if it works
    const isValidToken = await testGithubAccessToken({
      accessToken: authMetadata.token,
      clientId,
      clientSecret
    })
    if (!isValidToken) {
      return await invalidateUserAuthAndReturn()
    }

    return authMetadata
  }
