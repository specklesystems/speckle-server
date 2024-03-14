import type { MaybeNullOrUndefined, Nullable } from '@speckle/shared'

export const cleanFunctionLogo = (
  logo: MaybeNullOrUndefined<string>
): Nullable<string> => {
  if (!logo?.length) return null
  if (logo.startsWith('data:')) return logo
  if (logo.startsWith('http:')) return logo
  if (logo.startsWith('https:')) return logo
  return null
}

export enum FunctionTemplateId {
  Python = 'python',
  DotNet = '.net',
  TypeScript = 'typescript'
}
