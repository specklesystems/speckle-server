import { AllScopes } from '@/modules/core/helpers/mainConstants'
import { UserRecord } from '@/modules/core/helpers/types'
import { createPersonalAccessToken } from '@/modules/core/services/tokens'
import { createUser } from '@/modules/core/services/users'

export type BasicTestUser = {
  name: string
  email: string
  password: string
  /**
   * Will be set by createTestUser()
   */
  id: string
} & Partial<UserRecord>

/**
 * Create basic user for tests and on success mutate the input object to have
 * the new ID
 */
export async function createTestUser(userObj: BasicTestUser) {
  const id = await createUser(userObj)
  userObj.id = id
}

/**
 * Create multiple users for tests and update them to include their ID
 */
export async function createTestUsers(userObjs: BasicTestUser[]) {
  await Promise.all(userObjs.map((o) => createTestUser(o)))
}

/**
 * Create an auth token for the specified user (use only during tests, of course)
 * @param userId User's ID
 * @param Specify scopes you want to allow. Defaults to all scopes.
 */
export async function createAuthTokenForUser(
  userId: string,
  scopes: string[] = AllScopes
): Promise<string> {
  return await createPersonalAccessToken(userId, 'test-runner-token', scopes)
}
