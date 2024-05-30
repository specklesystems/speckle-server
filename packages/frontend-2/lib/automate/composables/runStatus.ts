import type { MaybeNullOrUndefined } from '@speckle/shared'
import type { PropAnyComponent } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import {
  AutomateRunStatus,
  type FunctionRunStatusForSummaryFragment,
  type TriggeredAutomationsStatusSummaryFragment
} from '~/lib/common/generated/gql/graphql'
import {
  CheckCircleIcon,
  EllipsisHorizontalCircleIcon,
  EllipsisHorizontalIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'

graphql(`
  fragment FunctionRunStatusForSummary on AutomateFunctionRun {
    id
    status
  }
`)

graphql(`
  fragment TriggeredAutomationsStatusSummary on TriggeredAutomationsStatus {
    id
    automationRuns {
      id
      functionRuns {
        id
        ...FunctionRunStatusForSummary
      }
    }
  }
`)

export type RunsStatusSummary = {
  failed: number
  passed: number
  inProgress: number
  total: number
  title: string
  titleColor: string
  longSummary: string
}

export const useFunctionRunsStatusSummary = (params: {
  runs: MaybeRef<FunctionRunStatusForSummaryFragment[]>
}) => {
  const { runs } = params

  const summary = computed((): RunsStatusSummary => {
    const allFunctionRuns = unref(runs)
    const result: RunsStatusSummary = {
      failed: 0,
      passed: 0,
      inProgress: 0,
      total: allFunctionRuns.length,
      title: 'All runs passed.',
      titleColor: 'text-success',
      longSummary: ''
    }

    for (const run of allFunctionRuns) {
      switch (run.status) {
        case AutomateRunStatus.Succeeded:
          result.passed++
          break
        case AutomateRunStatus.Failed:
        case AutomateRunStatus.Exception:
        case AutomateRunStatus.Timeout:
        case AutomateRunStatus.Canceled:
          result.title = 'Some runs failed.'
          result.titleColor = 'text-danger'
          result.failed++
          break
        default:
          if (result.failed === 0) {
            result.title = 'Some runs are still in progress.'
            result.titleColor = 'text-warning'
          }
          result.inProgress++
          break
      }
    }

    // format:
    // 2 failed, 1 passed runs
    // 1 passed, 2 in progress, 1 failed runs
    // 1 passed run
    const longSummarySegments = []
    if (result.passed > 0) longSummarySegments.push(`${result.passed} passed`)
    if (result.inProgress > 0)
      longSummarySegments.push(`${result.inProgress} in progress`)
    if (result.failed > 0) longSummarySegments.push(`${result.failed} failed`)

    result.longSummary = (
      longSummarySegments.join(', ') + ` run${result.total > 1 ? 's' : ''}.`
    ).replace(/,(?=[^,]+$)/, ', and')

    return result
  })

  return { summary }
}

export const useAutomationsStatusRunsSummary = (params: {
  status: MaybeRef<MaybeNullOrUndefined<TriggeredAutomationsStatusSummaryFragment>>
}) => {
  const { status } = params

  const allFunctionRuns = computed(() => {
    const currentStatus = unref(status)
    if (!currentStatus) return []

    return currentStatus.automationRuns.flatMap((run) => run.functionRuns)
  })

  return useFunctionRunsStatusSummary({ runs: allFunctionRuns })
}

export type AutomateRunStatusMetadata = {
  icon: PropAnyComponent
  xsIcon: PropAnyComponent
  iconColor: string
  badgeColor: string
  disclosureColor: 'success' | 'warning' | 'danger' | 'default'
}

export const useRunStatusMetadata = (params: {
  status: MaybeRef<AutomateRunStatus>
}) => {
  const { status } = params

  const metadata = computed((): AutomateRunStatusMetadata => {
    switch (unref(status)) {
      case AutomateRunStatus.Canceled:
        return {
          icon: XCircleIcon,
          xsIcon: XCircleIcon,
          iconColor: 'text-warning',
          badgeColor: 'bg-warning',
          disclosureColor: 'warning'
        }
      case AutomateRunStatus.Exception:
        return {
          icon: ExclamationCircleIcon,
          xsIcon: ExclamationCircleIcon,
          iconColor: 'text-danger',
          badgeColor: 'bg-danger',
          disclosureColor: 'danger'
        }
      case AutomateRunStatus.Failed:
        return {
          icon: ExclamationCircleIcon,
          xsIcon: ExclamationCircleIcon,
          iconColor: 'text-danger',
          badgeColor: 'bg-danger',
          disclosureColor: 'danger'
        }
      case AutomateRunStatus.Initializing:
        return {
          icon: EllipsisHorizontalCircleIcon,
          xsIcon: EllipsisHorizontalIcon,
          iconColor: 'text-warning',
          badgeColor: 'bg-warning',
          disclosureColor: 'warning'
        }
      case AutomateRunStatus.Pending:
        return {
          icon: EllipsisHorizontalCircleIcon,
          xsIcon: EllipsisHorizontalIcon,
          iconColor: 'text-primary',
          badgeColor: 'bg-primary',
          disclosureColor: 'default'
        }
      case AutomateRunStatus.Running:
        return {
          icon: ArrowPathIcon,
          xsIcon: ArrowPathIcon,
          iconColor: 'text-primary animate-spin',
          badgeColor: 'bg-primary',
          disclosureColor: 'default'
        }
      case AutomateRunStatus.Succeeded:
        return {
          icon: CheckCircleIcon,
          xsIcon: CheckCircleIcon,
          iconColor: 'text-success',
          badgeColor: 'bg-success',
          disclosureColor: 'success'
        }
      case AutomateRunStatus.Timeout:
        return {
          icon: ClockIcon,
          xsIcon: ClockIcon,
          iconColor: 'text-danger',
          badgeColor: 'bg-danger',
          disclosureColor: 'danger'
        }
    }
  })

  return { metadata }
}
