import type { MaybeNullOrUndefined, Nullable } from '@speckle/shared'

export const parseGithubRepoUrl = (
  url: MaybeNullOrUndefined<string>
): Nullable<{ owner: string; name: string }> => {
  if (!url?.length) return null

  let repoUrl: URL
  try {
    repoUrl = new URL(url)
  } catch (e) {
    return null
  }

  const pathParts = repoUrl.pathname.split('/').filter(Boolean)
  if (pathParts.length < 2) {
    return null
  }

  const [owner, name] = pathParts
  return { owner, name }
}

export const buildGithubRepoSshUrl = (params: { owner: string; name: string }) => {
  const { owner, name } = params
  return `git@github.com:${owner}/${name}.git`
}

export const buildGithubRepoHttpCloneUrl = (params: {
  owner: string
  name: string
}) => {
  const { owner, name } = params
  return `https://github.com/${owner}/${name}.git`
}
