import {
  Automate,
  ensureError,
  type MaybeNullOrUndefined,
  type Optional
} from '@speckle/shared'
import dayjs from 'dayjs'
import { orderBy } from 'lodash-es'
import { useAuthCookie } from '~/lib/auth/composables/auth'
import { useFunctionRunsStatusSummary } from '~/lib/automate/composables/runStatus'
import {
  useFormatDuration,
  useReactiveNowDate
} from '~/lib/common/composables/datetime'
import { graphql } from '~/lib/common/generated/gql'
import {
  AutomateRunStatus,
  type AutomationRunDetailsFragment,
  type AutomationsStatusOrderedRuns_AutomationRunFragment
} from '~/lib/common/generated/gql/graphql'
import type { SetFullyRequired } from '~/lib/common/helpers/type'
import { abortControllerManager, isAbortError } from '~/lib/common/utils/requests'
import { useViewerRouteBuilder } from '~/lib/projects/composables/models'

graphql(`
  fragment AutomationRunDetails on AutomateRun {
    id
    status
    functionRuns {
      ...FunctionRunStatusForSummary
      statusMessage
    }
    trigger {
      ... on VersionCreatedTrigger {
        version {
          id
        }
        model {
          id
        }
      }
    }
    createdAt
    updatedAt
  }
`)

export const useAutomationRunSummary = (params: {
  run: MaybeRef<MaybeNullOrUndefined<AutomationRunDetailsFragment>>
}) => {
  const { run } = params

  const fnRuns = computed(() => unref(run)?.functionRuns || [])

  const { summary: coreSummary } = useFunctionRunsStatusSummary({
    runs: fnRuns
  })

  const summary = computed(() => {
    const errorMessages =
      unref(run)
        ?.functionRuns.filter(
          (r): r is SetFullyRequired<typeof r, 'statusMessage'> =>
            !!(
              [
                AutomateRunStatus.Failed,
                AutomateRunStatus.Canceled,
                AutomateRunStatus.Exception,
                AutomateRunStatus.Timeout
              ].includes(r.status) && r.statusMessage?.length
            )
        )
        .map((r) => r.statusMessage) || []
    const errorMessage = errorMessages.length ? errorMessages.join(', ') : undefined

    return {
      ...coreSummary.value,
      errorMessage
    }
  })

  return { summary }
}

export const useAutomationRunDetailsFns = () => {
  const formatDuration = useFormatDuration()
  const now = useReactiveNowDate()
  const { versionUrl } = useViewerRouteBuilder()

  const runStatusClasses = (run: AutomationRunDetailsFragment) => {
    const classParts = ['w-24 justify-center']
    const status = run.status

    switch (status) {
      case AutomateRunStatus.Pending:
      case AutomateRunStatus.Initializing:
        classParts.push('bg-warning-lighter text-warning-darker')
        break
      case AutomateRunStatus.Running:
        classParts.push('bg-info-lighter text-info-darker')
        break
      case AutomateRunStatus.Failed:
      case AutomateRunStatus.Exception:
      case AutomateRunStatus.Canceled:
      case AutomateRunStatus.Timeout:
        classParts.push('bg-danger-lighter text-danger-darker')
        break
      case AutomateRunStatus.Succeeded:
        classParts.push('bg-success-lighter text-success-darker')
        break
    }

    return classParts.join(' ')
  }

  const runModelVersionUrl = (params: {
    run: AutomationRunDetailsFragment
    projectId: string
  }) => {
    const {
      run: {
        trigger: { model, version }
      },
      projectId
    } = params
    return model && version
      ? versionUrl({
          projectId,
          modelId: model.id,
          versionId: version.id
        })
      : null
  }

  const runDate = (run: AutomationRunDetailsFragment) => {
    return dayjs(run.createdAt).fromNow()
  }

  const runDuration = (run: AutomationRunDetailsFragment) => {
    const start = run.createdAt
    const end =
      run.status === AutomateRunStatus.Running
        ? now.value
        : [AutomateRunStatus.Initializing, AutomateRunStatus.Pending].includes(
            run.status
          )
        ? undefined
        : run.updatedAt
    if (!end) return undefined

    const diff = dayjs(end).diff(dayjs(start))
    const duration = dayjs.duration(diff)
    const format = formatDuration(duration)

    if (duration.days() > 0) return dayjs.duration(diff).humanize()
    return dayjs.duration(diff).format(format)
  }

  return {
    runStatusClasses,
    runModelVersionUrl,
    runDate,
    runDuration
  }
}

export const useAutomationRunLogs = (params: {
  automationId: MaybeRef<Optional<string>>
  runId: MaybeRef<Optional<string>>
}) => {
  const { automationId, runId } = params
  const apiOrigin = useApiOrigin()

  const authToken = useAuthCookie()
  const { triggerNotification } = useGlobalToast()
  const loading = ref(false)
  const results = ref('')
  const isStreamFinished = ref(false)

  const url = computed(
    () => `/api/automate/automations/${unref(automationId)}/runs/${unref(runId)}/logs`
  )
  const key = computed(() => {
    if (!unref(automationId) || !unref(runId)) return null
    return `automation-run-logs-${unref(automationId)}-${unref(runId)}`
  })

  const aborts = abortControllerManager()
  const load = async () => {
    results.value = ''
    isStreamFinished.value = false

    if (!authToken.value) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Log retrieval failed',
        description: 'You need to be logged in to load the logs.'
      })
      isStreamFinished.value = true
      return
    }

    const res = await fetch(new URL(url.value, apiOrigin), {
      signal: aborts.pop().signal,
      headers: {
        Authorization: `Bearer ${authToken.value}`
      }
    }).catch((e) => {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Log retrieval failed',
        description: ensureError(e).message
      })

      throw e
    })

    if (res.status !== 200) {
      // Something bad happened
      const json = (await res.json()) as { error?: { message: string } }
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: "Couldn't load logs",
        description:
          json.error?.message || 'Something went wrong while loading the logs.'
      })
      isStreamFinished.value = true

      return false
    }

    const stream = res.body

    // Read stream into results ref
    if (stream) {
      const reader = stream.getReader()
      const decoder = new TextDecoder()
      const pump = async () => {
        return reader.read().then(({ done, value }): Promise<void> => {
          if (done) {
            isStreamFinished.value = true
            return Promise.resolve()
          }
          results.value += decoder.decode(value)
          return pump()
        })
      }

      // Intentionally not awaiting this so that we can return the ref
      void pump().catch((e) => {
        if (!isAbortError(e)) {
          throw e
        }
      })
    }

    return true
  }

  const loadAndMarkLoading = async () => {
    loading.value = true
    await load().finally(() => {
      loading.value = false
    })
  }

  watch(
    key,
    (newKey, oldKey) => {
      if (newKey && newKey !== oldKey) {
        void loadAndMarkLoading()
      }
    },
    { immediate: true }
  )

  return {
    data: computed(() => results.value),
    isDataLoaded: computed(() => isStreamFinished.value),
    loading: computed(() => loading.value)
  }
}

export const useAutomationFunctionRunResults = (params: {
  results: MaybeRef<MaybeNullOrUndefined<Record<string, unknown>>>
}) => {
  const { results } = params

  const ret = computed(
    (): MaybeNullOrUndefined<Automate.AutomateTypes.ResultsSchema> => {
      const res = unref(results)
      if (!res) return res

      if (!Automate.AutomateTypes.isResultsSchema(res)) return null
      return Automate.AutomateTypes.formatResultsSchema(res)
    }
  )

  return ret
}

graphql(`
  fragment AutomationsStatusOrderedRuns_AutomationRun on AutomateRun {
    id
    automation {
      id
      name
    }
    functionRuns {
      id
      updatedAt
    }
  }
`)

export const useAutomationsStatusOrderedRuns = <
  R extends AutomationsStatusOrderedRuns_AutomationRunFragment = AutomationsStatusOrderedRuns_AutomationRunFragment
>(params: {
  automationRuns: MaybeRef<R[]>
}) => {
  const { automationRuns } = params

  const runs = computed(() => {
    const ret: Array<
      R['functionRuns'][0] & {
        automationName: string
      }
    > = []

    for (const automationRun of unref(automationRuns)) {
      for (const run of automationRun.functionRuns) {
        ret.push({ ...run, automationName: automationRun.automation.name })
      }
    }

    return orderBy(ret, (r) => new Date(r.updatedAt).getTime(), 'desc')
  })

  return { runs }
}
