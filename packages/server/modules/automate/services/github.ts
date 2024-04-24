import {
  InvalidFunctionTemplateError,
  InvalidRepositoryUrlError,
  MissingAutomateGithubAuthError
} from '@/modules/automate/errors/github'
import { createRepoFromTemplate } from '@/modules/core/clients/github'
import { AutomateFunctionTemplateLanguage } from '@/modules/core/graph/generated/graphql'
import { getValidatedUserAuthMetadata } from '@/modules/core/services/githubApp'
import { Nullable } from '@speckle/shared'

export const functionTemplateRepos = <const>[
  {
    id: AutomateFunctionTemplateLanguage.Python,
    title: 'Python',
    url: 'https://github.com/specklesystems/speckle_automate_python_example',
    logo: '/images/functions/python.svg'
  },
  {
    id: AutomateFunctionTemplateLanguage.DotNet,
    title: '.NET / C#',
    url: 'https://github.com/specklesystems/SpeckleAutomateDotnetExample',
    logo: '/images/functions/dotnet.svg'
  }
]

export const getGithubRepoMetadataFromUrl = (
  repoHtmlUrl: string
): { org: string; repo: string } => {
  const [, org, repo] = /^https?:\/\/github.com\/([\w\d-]+)\/([\w\d-]+)/i.exec(
    repoHtmlUrl
  ) || [null, null, null]

  if (!org?.length || !repo?.length) {
    throw new InvalidRepositoryUrlError(
      "Couldn't resolve repo metadata from template URL",
      { info: { org, repo, repoHtmlUrl } }
    )
  }

  return { org, repo }
}

export type CreateRepoFromTemplateDeps = {
  getValidatedGithubAuthMetadata: ReturnType<typeof getValidatedUserAuthMetadata>
  createRepoFromTemplate: typeof createRepoFromTemplate
}

export const createAutomateRepoFromTemplate =
  (deps: CreateRepoFromTemplateDeps) =>
  async (params: {
    templateId: AutomateFunctionTemplateLanguage
    userId: string
    name: string
    org?: Nullable<string>
  }) => {
    const { templateId, userId, name, org } = params
    const { getValidatedGithubAuthMetadata, createRepoFromTemplate } = deps

    const templateMetadata = functionTemplateRepos.find((t) => t.id === templateId)
    if (!templateMetadata) {
      throw new InvalidFunctionTemplateError(undefined, { info: { templateId } })
    }

    const ghAuth = await getValidatedGithubAuthMetadata({ userId })
    if (!ghAuth) {
      throw new MissingAutomateGithubAuthError()
    }

    const { org: templateOwner, repo: templateRepo } = getGithubRepoMetadataFromUrl(
      templateMetadata.url
    )
    const newRepo = await createRepoFromTemplate({
      accessToken: ghAuth.token,
      templateOwner,
      templateRepo,
      name,
      owner: org?.length ? org : undefined
    })

    return newRepo
  }
