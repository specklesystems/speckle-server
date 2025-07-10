<template>
  <div>
    <CommonCard class="flex flex-1 flex-col gap-1 !p-4 !pt-2 !pb-3 h-full">
      <div class="flex gap-2 items-center">
        <div v-if="connector.images" class="relative flex items-start mr-2">
          <div
            v-for="(image, index) in connector.images"
            :key="image"
            :class="[
              'relative -ml-2 -mr-4',
              `-mb-[${index * 2}]`,
              `z-[${connector.images.length - index}]`
            ]"
          >
            <img :src="image" :alt="`${connector.title} logo`" class="w-[48px]" />
          </div>
        </div>
        <div class="flex flex-col gap-y-1.5">
          <h2 class="text-body-xs text-foreground font-medium leading-none">
            {{ connector.title }}
          </h2>
        </div>
      </div>
      <p
        class="text-body-2xs text-foreground-2 line-clamp-5 leading-5 lg:min-h-20 md:min-h-14 sm:min-h-8"
      >
        {{ connector.description }}
      </p>
      <div class="flex gap-1 mt-2">
        <div
          v-tippy="
            canDownload
              ? undefined
              : {
                  content: `Please <a href='${loginRoute}'>login</a> or <a href='${registerRoute}'>register</a> to download connectors`,
                  allowHTML: true,
                  interactive: true
                }
          "
        >
          <FormButton
            color="outline"
            size="sm"
            :disabled="enableButton"
            external
            :to="canDownload ? latestAvailableVersion?.Url : undefined"
            @click="
              mixpanel.track('Connector Card Install Clicked', {
                connector: props.connector.slug
              })
            "
          >
            {{ connector.isComingSoon ? 'Coming soon' : 'Install for Windows' }}
          </FormButton>
        </div>
        <FormButton
          v-if="connector.url"
          color="subtle"
          size="sm"
          target="_blank"
          external
          :to="connector.url"
          @click="
            mixpanel.track('Connector Card Documentation Clicked', {
              connector: props.connector.slug
            })
          "
        >
          Docs
        </FormButton>
      </div>
    </CommonCard>
  </div>
</template>

<script setup lang="ts">
import type { ConnectorItem, Version, Versions } from '~~/lib/dashboard/helpers/types'
import { useMixpanel } from '~/lib/core/composables/mp'
import { loginRoute, registerRoute } from '~~/lib/common/helpers/route'

const props = defineProps<{
  connector: ConnectorItem
  canDownload: boolean
}>()

const mixpanel = useMixpanel()
const { data: versionData, status } = useFetch(
  `https://releases.speckle.dev/manager2/feeds/${props.connector.slug}-v3.json`,
  {
    immediate: !props.connector.isComingSoon && props.canDownload
  }
)

const enableButton = computed(() => status.value !== 'success' || !props.canDownload)

const latestAvailableVersion = computed<Version | null>(() => {
  if (versionData.value) {
    const typedData = versionData.value as Versions
    const sortedVersions = [...typedData.Versions].sort(
      (a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()
    )
    return sortedVersions.length > 0 ? sortedVersions[0] : null
  }
  return null
})
</script>
