import { graphql } from '~/lib/common/generated/gql/gql'
import { useQuery } from '@vue/apollo-composable'
import { workspaceUsageQuery } from '~/lib/workspaces/graphql/queries'
import type { WorkspaceUsage_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment WorkspaceUsage_Workspace on Workspace {
    id
    slug
    plan {
      usage {
        projectCount
        modelCount
      }
    }
    team {
      totalCount
    }
    teamByRole {
      admins {
        totalCount
      }
      members {
        totalCount
      }
      guests {
        totalCount
      }
    }
  }
`)

export const useUsageState = () =>
  useState<WorkspaceUsage_WorkspaceFragment | null>('usage', () => null)

export const useWorkspaceUsage = (slug: string) => {
  const usageState = useUsageState()

  const { onResult } = useQuery(
    workspaceUsageQuery,
    () => ({
      slug
    }),
    () => ({
      enabled: !!slug && slug !== usageState.value?.slug
    })
  )

  onResult((result) => {
    usageState.value = result.data?.workspaceBySlug
  })

  const projectCount = computed(() => usageState.value?.plan?.usage.projectCount ?? 0)
  const modelCount = computed(() => usageState.value?.plan?.usage.modelCount ?? 0)

  const teamCount = computed(() => usageState.value?.team?.totalCount ?? 0)

  const adminCount = computed(
    () => usageState.value?.teamByRole.admins?.totalCount ?? 0
  )
  const memberCount = computed(
    () => usageState.value?.teamByRole.members?.totalCount ?? 0
  )
  const guestCount = computed(
    () => usageState.value?.teamByRole.guests?.totalCount ?? 0
  )

  return {
    projectCount,
    modelCount,
    teamCount,
    adminCount,
    memberCount,
    guestCount
  }
}
