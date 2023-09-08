<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink to="/server-management" name="Server Management"></HeaderNavLink>
    </Portal>
    <div
      class="flex flex-col md:flex-row space-y-2 space-x-2 justify-between mb-4 md:items-center"
    >
      <div>
        <h5 class="h4 font-bold">Your server at a glance</h5>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
      <ServerManagementCard
        :server-info="serverData"
        @cta-clicked="showDialog = true"
      />

      <ServerManagementSettingsDialog v-model:open="showDialog" />

      <ServerManagementCard :server-info="userData" />
      <ServerManagementCard :server-info="projectData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { serverManagementDataQuery } from '~~/lib/server-management/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import { ref, computed } from 'vue'
import { CardInfo } from '~~/lib/server-management/helpers/types'
import {
  ServerIcon,
  UsersIcon,
  EnvelopeIcon,
  ChartBarIcon,
  HomeIcon
} from '@heroicons/vue/24/solid'
import { useRouter } from 'vue-router'

interface GithubRelease {
  url: string
  assets_url: string
  upload_url: string
  html_url: string
  id: number
  node_id: string
  tag_name: string
}

definePageMeta({
  middleware: ['admin']
})

const logger = useLogger()
const router = useRouter()
const { result } = useQuery(serverManagementDataQuery)

const showDialog = ref(false)
const latestVersion = ref<string | null>(null)

const currentVersion = computed(() => result.value?.serverInfo.version)
const isLatestVersion = computed(() => {
  return (
    !latestVersion.value ||
    currentVersion.value === latestVersion.value ||
    currentVersion.value === 'dev' ||
    currentVersion.value?.includes('alpha') ||
    currentVersion.value === 'N/A'
  )
})
const serverData = computed((): CardInfo[] => [
  {
    title: 'Server',
    value: result.value?.serverInfo.name || 'N/A',
    icon: ServerIcon,
    cta: {
      type: 'button',
      label: 'Edit',
      action: () => {
        showDialog.value = true
      }
    }
  },
  {
    title: 'Speckle Version',
    value: currentVersion.value || 'N/A',
    icon: ChartBarIcon,
    cta: !isLatestVersion.value
      ? {
          type: 'link',
          label: 'Update is available',
          action: openGithubReleasePage
        }
      : {
          type: 'text',
          label: 'Up-to-date'
        }
  }
])
const userData = computed((): CardInfo[] => [
  {
    title: 'Active users',
    value: result.value?.admin.userList.totalCount?.toString() || 'N/A',
    icon: UsersIcon,
    cta: {
      type: 'button',
      label: 'Manage',
      action: () => navigate('/server-management/active-users/')
    }
  },
  {
    title: 'Pending invitations',
    value: result.value?.admin.inviteList.totalCount?.toString() || 'N/A',
    icon: EnvelopeIcon,
    cta: {
      type: 'button',
      label: 'Manage',
      action: () => navigate('/server-management/pending-invitations/')
    }
  }
])
const projectData = computed((): CardInfo[] => [
  {
    title: 'Projects',
    value: result.value?.admin.projectList.totalCount?.toString() || 'N/A',
    icon: HomeIcon,
    cta: {
      type: 'button',
      label: 'Manage',
      action: () => navigate('/server-management/projects/')
    }
  }
])

const openGithubReleasePage = () => {
  window.open('https://github.com/specklesystems/speckle-server/releases', '_blank')
}

const navigate = async (path: string) => {
  try {
    await router.push(path)
  } catch (error) {
    logger.error('Failed to navigate:', error)
  }
}

async function getLatestVersion(): Promise<string | null> {
  try {
    const response: Response = await fetch(
      'https://api.github.com/repos/specklesystems/speckle-server/releases/latest'
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    } else {
      const data = (await response.json()) as GithubRelease
      return data.tag_name
    }
  } catch (err) {
    logger.error(err)
    return null
  }
}

latestVersion.value = await getLatestVersion()
</script>
