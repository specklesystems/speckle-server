import type { DUIAccount } from '~/store/accounts'
import { useAccountStore } from '~/store/accounts'
import type {
  ModelListModelItemFragment,
  ProjectListProjectItemFragment,
  VersionListItemFragment
} from '~/lib/common/generated/gql/graphql'
import {
  projectAddByUrlQueryWithoutVersion,
  projectAddByUrlQueryWithVersion
} from '~/lib/graphql/mutationsAndQueries'
import { omit } from 'lodash-es'
import { useDebounceFn } from '@vueuse/core'

export function useAddByUrl() {
  const accountStore = useAccountStore()

  /**
   * Will store any ok results from an url parsing attempt.
   */
  const urlParsedData = ref<{
    project: ProjectListProjectItemFragment
    model: ModelListModelItemFragment
    version?: VersionListItemFragment
    account: DUIAccount
  }>()

  /**
   * Will only hold an error if the provided string is:
   * - an invalid url
   * - there is no account found for that server
   * - there are no permissions to send to that stream
   */
  const urlParseError = ref<string | undefined>()

  const tryParseUrlInternal = async (url: string, type: 'sender' | 'receiver') => {
    urlParsedData.value = undefined

    // try to parse url first, as if it fails we should return early.
    try {
      new URL(url)
    } catch {
      urlParseError.value = '' // we do not care random strings
      return
    }

    const parsedUrl = new URL(url)
    const params = extractIds(parsedUrl.pathname)

    if (!params) {
      urlParseError.value = 'Invalid url.'
      return
    }

    const acc = accountStore.accountByServerUrl(parsedUrl.origin)
    if (!acc) {
      urlParseError.value = 'No account found.'
      return
    }

    const { projectId, modelId, versionId } = params
    const apollo = (acc as DUIAccount).client

    let project: ProjectListProjectItemFragment | undefined = undefined,
      model: ModelListModelItemFragment | undefined = undefined,
      version: VersionListItemFragment | undefined = undefined
    try {
      if (versionId) {
        const res = await apollo.query({
          query: projectAddByUrlQueryWithVersion,
          variables: {
            projectId,
            modelId,
            versionId
          }
        })

        project = omit(res.data.project, [
          'model',
          ''
        ]) as ProjectListProjectItemFragment
        model = omit(res.data.project.model, ['version']) as ModelListModelItemFragment
        version = res.data.project.model.version as VersionListItemFragment
      } else {
        const res = await apollo.query({
          query: projectAddByUrlQueryWithoutVersion,
          variables: {
            projectId,
            modelId
          }
        })

        project = omit(res.data.project, [
          'model',
          ''
        ]) as ProjectListProjectItemFragment
        model = omit(res.data.project.model, ['version']) as ModelListModelItemFragment
        //version = res.data.project.model.versions.items[0] as VersionListItemFragment
      }
    } catch {
      urlParseError.value = 'Failed to retrieve project info.'
      return
    }

    if (project && model && acc) {
      const errorMessage =
        type === 'sender'
          ? project.permissions.canPublish.message
          : project.permissions.canLoad.message

      const hasAccess =
        type === 'sender'
          ? project.permissions.canPublish.authorized
          : project.permissions.canLoad.authorized

      if (!hasAccess) {
        urlParseError.value = errorMessage
        return
      }

      urlParsedData.value = {
        project,
        model,
        version,
        account: acc as DUIAccount
      }
    }
  }

  /**
   * Debounced function, call as much as you want. Will store any valid results in urlParsedData.
   */
  const tryParseUrl = useDebounceFn(tryParseUrlInternal, 1000)

  const extractIds = (pathname: string) => {
    // Regex to match the pattern in the pathname
    const regex = /\/projects\/([^/]+)\/models\/([^@]+)(?:@([^/]+))?/
    const match = pathname.match(regex)
    if (match) {
      // Extract the projectId and modelId
      const projectId = match[1]
      const modelId = match[2]
      // If versionId is not defined, default to 'latest'
      const versionId = match[3] || undefined
      return { projectId, modelId, versionId }
    } else {
      // Return null if the URL does not match the expected pattern
      return undefined
    }
  }

  return { tryParseUrl, urlParsedData, urlParseError }
}
