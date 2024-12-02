import { VersionCreationTriggerType } from '@/modules/automate/helpers/types'
import {
  AutomateFunctionTemplateLanguage,
  AutomateRunTriggerType
} from '@/modules/core/graph/generated/graphql'
import { Nullable, SourceAppName } from '@speckle/shared'

// TODO: These should be managed in a shared package maybe?
export type FunctionSchemaType = {
  functionId: string
  repoUrl: string
  functionName: string
  description: string
  tags: string[]
  supportedSourceApps: SourceAppName[]
  createdAt: string
  isFeatured: boolean
  logo: Nullable<string>
  functionCreator: Nullable<{
    speckleUserId: string
    speckleServerOrigin: string
  }>
  workspaceIds: string[]
}

export type FunctionReleaseSchemaType = {
  functionVersionId: string
  versionTag: string
  inputSchema: Nullable<Record<string, unknown>>
  createdAt: string
  commitId: string
}

export type FunctionWithVersionsSchemaType = FunctionSchemaType & {
  functionVersions: FunctionReleaseSchemaType[]
}

// TODO: Retrieve from API
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

export const dbToGraphqlTriggerTypeMap = <const>{
  [VersionCreationTriggerType]: AutomateRunTriggerType.VersionCreated
}

export const graphqlToDbTriggerTypeMap = <const>{
  [AutomateRunTriggerType.VersionCreated]: VersionCreationTriggerType
}
