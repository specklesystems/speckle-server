<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink :to="'/connectors'" name="Connector Downloads"></HeaderNavLink>
    </Portal>
    <div
      class="flex flex-col md:flex-row space-y-2 space-x-2 justify-between mb-4 md:items-center"
    >
      <div>
        <h5 class="h4 font-bold">Connector Downloads</h5>
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
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="(tag, index) in searchResults" :key="index">
        <ConnectorsCard :tag="tag" />
      </div>
    </div>
    <div v-if="searchResults.length === 0" class="w-full">
      No connector found.d Feel free to ask for it on our
      <FormButton link to="https://speckle.community/" target="_blank">
        community forum!
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
// import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { ConnectorTag, ConnectorVersion, Tag } from '~~/lib/connectors'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/solid'
definePageMeta({
  title: 'Speckle Connectors'
})

// const { isLoggedIn } = useActiveUser()

const response = await useFetch(
  'https://speckle.systems/ghost/api/v3/content/tags?key=c895981da23dbb5c87ee7192e2&limit=all'
)

// useLazyFetch

const showManagerDownloadDialog = ref(false)

const spacesEndpoint = 'https://releases.speckle.dev'

const relevantTags = (
  (response.data.value as Record<string, unknown>).tags as Record<string, unknown>[]
).filter((tag) => {
  if (!tag.codeinjection_head) return false
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, camelcase
  tag.codeinjection_head = (tag.codeinjection_head as string).replace(/\s/g, '')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  if ((tag.codeinjection_head as string).match(/(window.connectorTag=true)/))
    return true
}) as Tag[]

const connectorTags = ref<ConnectorTag[]>([])

for (const tag of relevantTags) {
  const connectorTag = { ...tag } as ConnectorTag

  const community = tag.codeinjection_head.match(/window.community="([\s\S]*?)"/)
  connectorTag.communityProvider = community ? community[1] : undefined
  connectorTag.isCommunity = !!connectorTag.communityProvider

  const installLink = tag.codeinjection_head.match(/window.installLink="([\s\S]*?)"/)
  connectorTag.installLink = installLink ? installLink[1] : undefined

  try {
    if (connectorTag.installLink?.includes('SpeckleManager')) {
      connectorTag.directDownload = true
      const { data } = await useFetch(
        `${spacesEndpoint}/manager2/feeds/${tag.slug}.json`
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const versions = (data.value as { Versions: ConnectorVersion[] }).Versions.sort(
        (a: ConnectorVersion, b: ConnectorVersion) =>
          new Date(b.Date).getTime() - new Date(a.Date).getTime()
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

  connectorTags.value.push(connectorTag)
}

connectorTags.value = connectorTags.value.sort((a, b) => {
  return b.versions.length - a.versions.length
})

const searchString = ref<string>()

const searchResults = computed(() => {
  if (!searchString.value) return connectorTags.value
  return connectorTags.value.filter((t) =>
    t.name.toLowerCase().includes(searchString.value?.toLowerCase() as string)
  )
})
</script>
