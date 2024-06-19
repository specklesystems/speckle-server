import { UserInfo } from '@/modules/auth/domain/types'

/* eslint-disable camelcase */
export function getNameFromUserInfo({
  name,
  given_name,
  family_name
}: Pick<UserInfo, 'name' | 'given_name' | 'family_name'>): string {
  if (!name && !given_name && !family_name) {
    return ''
  }

  if (name) {
    return name
  }

  let resultName = given_name ?? ''

  if (family_name) {
    resultName += given_name ? ` ${family_name}` : family_name
  }

  return resultName
}
