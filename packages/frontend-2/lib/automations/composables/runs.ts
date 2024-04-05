import type { Optional } from '@speckle/shared'
import { useIntervalFn } from '@vueuse/core'
import dayjs from 'dayjs'
import {
  useFormatDuration,
  useReactiveNowDate
} from '~/lib/common/composables/datetime'
import { graphql } from '~/lib/common/generated/gql'
import {
  AutomateRunStatus,
  type AutomationRunDetailsFragment
} from '~/lib/common/generated/gql/graphql'
import { useViewerRouteBuilder } from '~/lib/projects/composables/models'

graphql(`
  fragment AutomationRunDetails on AutomateRun {
    id
    status
    reason
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
  // TODO: Faked for now, should be a REST endpoint later on
  const { automationId, runId } = params

  const data = ref('')
  const isDataLoaded = ref(false)
  const loading = ref(false)
  let counter = 0

  const interval = useIntervalFn(
    () => {
      data.value =
        data.value +
        `#${counter} Log line - ${unref(automationId)} - ${unref(
          runId
        )} ${Math.random()}\n`
      counter++

      if (counter >= 10) {
        interval.pause()
        isDataLoaded.value = true
        loading.value = false
      }
    },
    1000,
    { immediate: false }
  )

  watch(
    () => <const>[unref(automationId), unref(runId)],
    ([newAId, newRId]) => {
      data.value = ''
      loading.value = false
      isDataLoaded.value = false
      counter = 0

      if (newAId?.length && newRId?.length) {
        loading.value = true
        interval.resume()
      }
    },
    { immediate: true }
  )

  return {
    data: computed(() => data.value),
    isDataLoaded: computed(() => isDataLoaded.value),
    loading: computed(() => loading.value)
  }
}
