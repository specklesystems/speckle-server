<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink :to="'/connectors'" name="Connectors"></HeaderNavLink>
    </Portal>

    <div class="flex mb-4 items-center justify-between">
      <div>
        <h5 class="h4 font-bold">Connectors</h5>
        <p>Start scaffolding your interoperability and automation workflows.</p>
      </div>
      <div>
        <FormTextInput
          size="lg"
          name="search"
          class="bg-foundation"
          search
          placeholder="Search for a connector"
        />
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="(tag, index) in connectorTags" :key="index">
        <ConnectorsCard :tag="tag" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { ConnectorTag, ConnectorVersion, Tag } from '~~/lib/connectors'

definePageMeta({
  title: 'Speckle Connectors'
})

const { isLoggedIn } = useActiveUser()

const response = await useFetch(
  'https://speckle.systems/ghost/api/v3/content/tags?key=c895981da23dbb5c87ee7192e2&limit=all'
)

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
    } else {
      connectorTag.directDownload = false
    }
  } catch (e) {
    connectorTag.directDownload = false
    connectorTag.versions = []
    // gotta catch 'em all!
  }

  connectorTags.value.push(connectorTag)
}

// const connectorTags = computed(() => {
//   const arr = (response.data.value as Record<string, unknown>).tags as Record<
//     string,
//     unknown
//   >[]
//   const relevantTags = arr.filter((tag: Record<string, unknown>) => {
//     if (!tag.codeinjection_head) return false
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-call, camelcase
//     tag.codeinjection_head = (tag.codeinjection_head as string).replace(/\s/g, '')
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-call
//     if ((tag.codeinjection_head as string).match(/(window.connectorTag=true)/))
//       return true
//   }) as Tag[]

//   const tags = [] as ConnectorTag[]

//   for (const tag of relevantTags) {
//     const connectorTag = { ...tag } as ConnectorTag

//     const installLink = tag.codeinjection_head.match(/window.installLink="([\s\S]*?)"/)
//     connectorTag.installLink = installLink ? installLink[1] : null
//     // try {
//     //   if (installLink?.includes('SpeckleManager')) {
//     //     connectorTag.directDownload = true
//     //     // const { data } = await useFetch(`${spacesEndpoint}/manager2/feeds/${tag.slug}`)
//     //     // // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
//     //     // const versions = data.value.Versions.sort(
//     //     //   (a: { Date: string }, b: { Date: string }) =>
//     //     //     new Date(b.Date).getTime() - new Date(a.Date).getTime()
//     //     // )
//     //     // console.log(versions)
//     //   } else {
//     //     connectorTag.directDownload = false
//     //   }
//     // } catch (e) {
//     //   // gotta catch 'em all!
//     // }

//     tags.push(connectorTag)
//   }

//   return tags
// })
</script>
