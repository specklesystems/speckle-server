import { graphql } from '~/lib/common/generated/gql/gql'
import { useQuery } from '@vue/apollo-composable'
import { workspaceUsageQuery } from '~/lib/workspaces/graphql/queries'

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

export const useWorkspaceUsage = (slug: string) => {
  const { result } = useQuery(
    workspaceUsageQuery,
    () => ({
      slug
    }),
    () => ({
      enabled: !!slug
    })
  )

  const projectCount = computed(
    () => result.value?.workspaceBySlug?.plan?.usage.projectCount ?? 0
  )
  const modelCount = computed(
    () => result.value?.workspaceBySlug?.plan?.usage.modelCount ?? 0
  )

  const teamCount = computed(() => result.value?.workspaceBySlug?.team?.totalCount ?? 0)

  const adminCount = computed(
    () => result.value?.workspaceBySlug?.teamByRole.admins?.totalCount ?? 0
  )
  const memberCount = computed(
    () => result.value?.workspaceBySlug?.teamByRole.members?.totalCount ?? 0
  )
  const guestCount = computed(
    () => result.value?.workspaceBySlug?.teamByRole.guests?.totalCount ?? 0
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
