import type { MaybeNullOrUndefined } from '@speckle/shared'
import type { MaybeRef } from '@vueuse/core'

export type GithubApiRepo = {
  id: number
  node_id: string
  name: string
  full_name: string
  private: boolean
  owner: {
    login: string
    id: number
    node_id: string
    avatar_url: string
    gravatar_id: string
    url: string
    html_url: string
    type: string
    site_admin: boolean
  }
  license?: {
    key: string
    name: string
    spdx_id: string
    url: string
    node_id: string
  }
}

export const useResolveGitHubRepoFromUrl = (url: MaybeRef<string>) => {
  const repo = computed(() => {
    const u = unref(url)
    if (!u) return

    const repo = u.replace(/https?:\/\/github\.com\//, '')
    if (repo.endsWith('.git')) return repo.slice(0, -4)
    return repo
  })

  return { repo }
}

export const useGetRawGithubReadme = (
  repo: MaybeRef<string>,
  commitHash?: MaybeRef<MaybeNullOrUndefined<string>>
) => {
  const url = computed(
    () =>
      `https://raw.githubusercontent.com/${unref(repo)}/${
        unref(commitHash) || 'master'
      }/README.md`
  )
  return useFetch<string>(url, { key: url.value, server: true })
}

export const useGetGithubRepo = (repo: MaybeRef<string>) =>
  useFetch<GithubApiRepo>(
    computed(() => `https://api.github.com/repos/${unref(repo)}`),
    { key: `https://api.github.com/repos/${unref(repo)}` }
  )
