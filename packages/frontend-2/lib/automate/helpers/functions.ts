import type { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import type { AutomateFunctionCreateDialogTemplateStep_AutomateFunctionTemplateFragment } from '~/lib/common/generated/gql/graphql'

export type CreatableFunctionTemplate =
  AutomateFunctionCreateDialogTemplateStep_AutomateFunctionTemplateFragment

export const cleanFunctionLogo = (
  logo: MaybeNullOrUndefined<string>
): Nullable<string> => {
  if (!logo?.length) return null
  if (logo.startsWith('data:')) return logo
  if (logo.startsWith('http:')) return logo
  if (logo.startsWith('https:')) return logo
  return null
}
