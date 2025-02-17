<template>
  <div class="flex flex-col space-y-6">
    <h2 class="text-xl">Speckle Version</h2>
    <div class="flex items-center">
      <div class="w-[50%]">
        <p class="text-sm">
          <span class="font-medium">Current version:</span>
          {{ currentVersion }}
        </p>
        <p v-if="!isLatestVersion" class="text-sm pt-2">New version available</p>
      </div>
      <div class="flex justify-end w-[50%]">
        <FormButton
          color="outline"
          :disabled="isLatestVersion"
          @click="openGithubReleasePage"
        >
          {{ isLatestVersion ? 'You are up to date' : `Update to ${latestVersion}` }}
        </FormButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { serverManagementDataQuery } from '~~/lib/server-management/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import { ref, computed } from 'vue'

interface GithubRelease {
  url: string
  assets_url: string
  upload_url: string
  html_url: string
  id: number
  node_id: string
  tag_name: string
}

const logger = useLogger()
const { result } = useQuery(serverManagementDataQuery)

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

const openGithubReleasePage = () => {
  window.open('https://github.com/specklesystems/speckle-server/releases', '_blank')
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
