import { AutomationRunStatus } from '~~/lib/common/generated/gql/graphql'
import {
  CheckCircleIcon,
  CheckIcon,
  XCircleIcon,
  XMarkIcon,
  EllipsisHorizontalCircleIcon,
  EllipsisHorizontalIcon,
  ArrowRightCircleIcon,
  ArrowRightIcon
} from '@heroicons/vue/24/solid'

export const resolveStatusMetadata = (
  status: AutomationRunStatus
): {
  icon: typeof CheckCircleIcon
  xsIcon: typeof CheckCircleIcon
  iconColor: string
  badgeColor: string
  disclosureColor: 'success' | 'warning' | 'danger' | 'default'
} => {
  switch (status) {
    case AutomationRunStatus.Succeeded:
      return {
        icon: CheckCircleIcon,
        xsIcon: CheckIcon,
        iconColor: 'text-success',
        badgeColor: 'bg-success',
        disclosureColor: 'success'
      }
    case AutomationRunStatus.Failed:
      return {
        icon: XCircleIcon,
        xsIcon: XMarkIcon,
        iconColor: 'text-danger',
        badgeColor: 'bg-danger',
        disclosureColor: 'danger'
      }
    case AutomationRunStatus.Running:
      return {
        icon: ArrowRightCircleIcon,
        xsIcon: ArrowRightIcon,
        iconColor: 'text-warning animate-pulse',
        badgeColor: 'bg-warning',
        disclosureColor: 'default'
      }
    case AutomationRunStatus.Initializing:
      return {
        icon: EllipsisHorizontalCircleIcon,
        xsIcon: EllipsisHorizontalIcon,
        iconColor: 'text-warning animate-pulse',
        badgeColor: 'bg-warning',
        disclosureColor: 'warning'
      }
  }
}
