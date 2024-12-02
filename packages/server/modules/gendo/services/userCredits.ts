import { GetUserCredits, UpsertUserCredits } from '@/modules/gendo/domain/operations'
import { UserCredits } from '@/modules/gendo/domain/types'
import { InsufficientGendoRenderCreditsError } from '@/modules/gendo/errors/main'
import dayjs from 'dayjs'

type GetUserGendoAiCredits = (args: { userId: string }) => Promise<UserCredits>

export const getUserGendoAiCreditsFactory =
  ({
    getUserCredits,
    upsertUserCredits
  }: {
    getUserCredits: GetUserCredits
    upsertUserCredits: UpsertUserCredits
  }) =>
  async ({ userId }: { userId: string }) => {
    //
    const userCredits = await getUserCredits({ userId })
    if (userCredits && userCredits.resetDate.getTime() > new Date().getTime())
      return userCredits

    const resetDate = dayjs(userCredits?.resetDate || new Date())
      .add(1, 'month')
      .toDate()

    const newCredits = {
      used: 0,
      userId,
      resetDate
    }
    await upsertUserCredits({ userCredits: newCredits })
    return newCredits
  }

export const useUserGendoAiCreditsFactory =
  ({
    getUserGendoAiCredits,
    upsertUserCredits,
    maxCredits
  }: {
    getUserGendoAiCredits: GetUserGendoAiCredits
    upsertUserCredits: UpsertUserCredits
    maxCredits: number
  }) =>
  async ({ userId, credits }: { userId: string; credits: number }) => {
    const userCredits = await getUserGendoAiCredits({ userId })
    userCredits.used += credits
    if (userCredits.used > maxCredits) throw new InsufficientGendoRenderCreditsError()
    await upsertUserCredits({ userCredits })
  }
