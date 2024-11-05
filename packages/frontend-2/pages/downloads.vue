<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink :to="'/downloads'" name="Speckle connectors"></HeaderNavLink>
    </Portal>
    <div
      class="flex flex-col md:flex-row space-y-2 space-x-2 justify-between mb-4 md:items-center"
    >
      <div>
        <h5 class="text-heading-lg">Connector downloads</h5>
        <div class="text-sm text-foreground-2 max-w- max-w-sm">
          Most of our connectors are available through Speckle Manager. You can also
          direct download the individual installers below.
        </div>
      </div>
      <div>
        <FormButton size="lg" full-width @click="showManagerDownloadDialog = true">
          Download Manager
        </FormButton>
      </div>
    </div>

    <OnboardingDialogManager
      v-model:open="showManagerDownloadDialog"
      @done="showManagerDownloadDialog = false"
      @cancel="showManagerDownloadDialog = false"
    ></OnboardingDialogManager>
    <div class="mb-4">
      <div>
        <FormTextInput
          v-model="searchString"
          size="xl"
          name="search"
          :custom-icon="MagnifyingGlassIcon"
          color="foundation"
          full-width
          search
          :show-clear="!!searchString"
          placeholder="Search for a connector"
        />
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div v-for="(tag, index) in searchResults" :key="index">
        <ConnectorsCard :tag="tag" />
      </div>
    </div>
    <div v-if="searchResults.length === 0" class="w-full">
      No connector found. Feel free to ask for it on our
      <FormButton link to="https://speckle.community/" target="_blank">
        community forum!
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { ConnectorTag, ConnectorVersion, Tag } from '~~/lib/connectors'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/solid'

useHead({
  title: 'Speckle Connectors'
})

const spacesEndpoint = 'https://releases.speckle.dev'
const cmsTagsEndpoint =
  'https://v1.speckle.systems/ghost/api/v3/content/tags?key=c895981da23dbb5c87ee7192e2&limit=all'

const connectorTags = await useAppCached(
  'connector-downloads',
  async () => {
    const cmsTags = await $fetch<{
      tags: Record<string, unknown>[]
    }>(cmsTagsEndpoint)
    const relevantTags = cmsTags.tags.filter((tag) => {
      if (!tag.codeinjection_head) return false
      // eslint-disable-next-line camelcase
      tag.codeinjection_head = (tag.codeinjection_head as string).replace(/\s/g, '')

      if ((tag.codeinjection_head as string).match(/(window.connectorTag=true)/))
        return true
    }) as Tag[]

    const connectorTags = await Promise.all(
      relevantTags.map(async (tag) => {
        const connectorTag = { ...tag } as ConnectorTag

        const community = tag.codeinjection_head.match(/window.community="([\s\S]*?)"/)
        connectorTag.communityProvider = community ? community[1] : undefined
        connectorTag.isCommunity = !!connectorTag.communityProvider

        const installLink = tag.codeinjection_head.match(
          /window.installLink="([\s\S]*?)"/
        )
        connectorTag.installLink = installLink ? installLink[1] : undefined

        try {
          if (connectorTag.installLink?.includes('SpeckleManager')) {
            connectorTag.directDownload = true

            const tagFeed = await $fetch<{
              Versions: ConnectorVersion[]
            }>(`${spacesEndpoint}/manager2/feeds/${tag.slug}.json`)

            const versions = tagFeed.Versions.sort(
              (a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()
            )
            connectorTag.versions = versions && versions.length > 0 ? versions : []
            connectorTag.stable = versions.find((x) => !x.Prerelease)?.Number
          } else {
            connectorTag.directDownload = false
            connectorTag.versions = []
          }
        } catch (e) {
          connectorTag.directDownload = false
          connectorTag.versions = []
          // gotta catch 'em all!
        }

        return connectorTag
      })
    )

    connectorTags.sort((a, b) => {
      return b.versions.length - a.versions.length
    })

    return connectorTags
  },
  {
    expiryMs:
      // Cache for an hour
      1000 * 60 * 60
  }
)

const showManagerDownloadDialog = ref(false)
const searchString = ref<string>()

const searchResults = computed(() => {
  if (!searchString.value) return connectorTags
  return connectorTags.filter((t) =>
    t.name.toLowerCase().includes(searchString.value?.toLowerCase() as string)
  )
})
</script>
