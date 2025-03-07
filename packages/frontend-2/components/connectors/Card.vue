<template>
  <div>
    <CommonCard
      class="flex flex-1 flex-col gap-1 !p-4 !pt-2 !pb-3 hover:border-outline-2"
    >
      <div class="flex gap-2 items-center">
        <img
          v-if="connector.image"
          :src="connector.image"
          :alt="`${connector.title} logo`"
          class="w-[48px] -ml-1"
        />
        <div class="flex flex-col gap-y-1.5">
          <p
            v-if="connector.isComingSoon"
            class="text-body-3xs text-foreground-2 leading-none"
          >
            Coming soon
          </p>
          <h2 class="text-body-xs text-foreground font-medium leading-none">
            {{ connector.title }}
          </h2>
        </div>
      </div>
      <p class="text-body-2xs text-foreground-2 line-clamp-2 leading-5">
        {{ connector.description }}
      </p>
      <div class="space-x-2 mt-2">
        <FormButton
          color="outline"
          size="sm"
          :disabled="isLoadingVersions"
          external
          :to="latestAvailableVersion?.Url"
          @click="
            mixpanel.track('Connector Card Install Clicked', {
              connector: props.connector.slug
            })
          "
        >
          {{ connector.isComingSoon ? 'Coming soon' : 'Install' }}
        </FormButton>
        <FormButton
          v-if="connector.url"
          color="outline"
          size="sm"
          text
          target="_blank"
          external
          :to="connector.url"
          @click="
            mixpanel.track('Connector Card Documentation Clicked', {
              connector: props.connector.slug
            })
          "
        >
          Documentation
        </FormButton>
      </div>
    </CommonCard>
  </div>
</template>

<script setup lang="ts">
import type { ConnectorItem, Version, Versions } from '~~/lib/dashboard/helpers/types'
import { useMixpanel } from '~/lib/core/composables/mp'

const props = defineProps<{
  connector: ConnectorItem
}>()

const mixpanel = useMixpanel()

const versions = ref<Version[]>([])
const latestAvailableVersion = ref<Version | null>(null)
const isLoadingVersions = ref(true)

const getVersions = async () => {
  const response = await fetch(
    `https://releases.speckle.dev/manager2/feeds/${props.connector.slug}-v3.json`,
    {
      method: 'GET'
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch versions')
  }

  const data = (await response.json()) as unknown as Versions
  const sortedVersions = data.Versions.sort(function (a: Version, b: Version) {
    return new Date(b.Date).getTime() - new Date(a.Date).getTime()
  })
  versions.value = sortedVersions
  latestAvailableVersion.value = sortedVersions[0]

  isLoadingVersions.value = false
}

void getVersions()
</script>
