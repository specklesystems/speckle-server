import { Automate, type MaybeNullOrUndefined, type Optional } from '@speckle/shared'
import dayjs from 'dayjs'
import { orderBy } from 'lodash-es'
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
import { abortControllerManager, isAbortError } from '~/lib/common/utils/requests'
import { useViewerRouteBuilder } from '~/lib/projects/composables/models'

graphql(`
  fragment AutomationRunDetails on AutomateRun {
    id
    status
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

export const useAutomationRunDetailsFns = () => {
  const formatDuration = useFormatDuration()
  const now = useReactiveNowDate()
  const { versionUrl } = useViewerRouteBuilder()

  const runStatusClasses = (run: AutomationRunDetailsFragment) => {
    const classParts = ['w-24 justify-center']
    const status = run.status

    switch (status) {
      case AutomateRunStatus.Initializing:
        classParts.push('bg-warning-lighter text-warning-darker')
        break
      case AutomateRunStatus.Running:
        classParts.push('bg-info-lighter text-info-darker')
        break
      case AutomateRunStatus.Failed:
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
    const { run, projectId } = params
    return versionUrl({
      projectId,
      modelId: run.trigger.model.id,
      versionId: run.trigger.version.id
    })
  }

  const runDate = (run: AutomationRunDetailsFragment) => {
    return dayjs(run.createdAt).fromNow()
  }

  const runDuration = (run: AutomationRunDetailsFragment) => {
    const start = run.createdAt
    const end =
      run.status === AutomateRunStatus.Running
        ? now.value
        : [AutomateRunStatus.Initializing].includes(run.status)
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

    const res = await fetch(new URL(url.value, apiOrigin), {
      signal: aborts.pop().signal
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
