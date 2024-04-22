import type {
  MaybeNullOrUndefined,
  Nullable,
  SourceAppDefinition
} from '@speckle/shared'
import type { AutomateFunctionCreateDialogTemplateStep_AutomateFunctionTemplateFragment } from '~/lib/common/generated/gql/graphql'

export type CreatableFunctionTemplate =
  AutomateFunctionCreateDialogTemplateStep_AutomateFunctionTemplateFragment

export type FunctionDetailsFormValues = {
  image?: Nullable<string>
  name: string
  description: string
  allowedSourceApps?: SourceAppDefinition[]
  tags?: string[]
  org?: string
}

export const cleanFunctionLogo = (
  logo: MaybeNullOrUndefined<string>
): Nullable<string> => {
  if (!logo?.length) return null
  if (logo.startsWith('data:')) return logo
  if (logo.startsWith('http:')) return logo
  if (logo.startsWith('https:')) return logo
  return null
}
