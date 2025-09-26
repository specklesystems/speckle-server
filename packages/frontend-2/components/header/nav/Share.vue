<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <Menu as="div" class="flex items-center relative">
    <MenuButton :id="menuButtonId" v-slot="{ open }" as="div">
      <!-- Desktop Button -->
      <FormButton
        color="outline"
        class="hidden sm:flex"
        :icon-right="open ? ChevronUpIcon : ChevronDownIcon"
      >
        Share
      </FormButton>
      <!-- Mobile Button -->
      <FormButton
        color="subtle"
        size="sm"
        class="sm:hidden"
        :icon-right="ShareIcon"
        hide-text
      >
        Share
      </FormButton>
    </MenuButton>

    <MenuItems
      class="absolute z-50 flex flex-col gap-1 right-0 top-11 min-w-max w-full sm:w-32 py-1 origin-top-right bg-foundation outline outline-1 outline-primary-muted rounded-md shadow-lg overflow-hidden mt-1"
    >
      <MenuItem v-slot="{ active }">
        <div
          :class="[
            active ? 'bg-highlight-1' : '',
            'text-body-xs flex px-2 py-1 text-foreground cursor-pointer transition mx-1 rounded'
          ]"
          @click="handleCopyLink"
          @keypress="keyboardClick(handleCopyLink)"
        >
          Copy link
        </div>
      </MenuItem>
      <MenuItem v-if="!isFederated" v-slot="{ active }">
        <div
          :class="[
            active ? 'bg-highlight-1' : '',
            'text-body-xs flex px-2 py-1 text-foreground cursor-pointer transition mx-1 rounded'
          ]"
          @click="handleCopyId"
          @keypress="keyboardClick(handleCopyId)"
        >
          Copy ID
        </div>
      </MenuItem>
      <MenuItem v-slot="{ active }">
        <div
          :class="[
            active ? 'bg-highlight-1' : '',
            'text-body-xs flex px-2 py-1 text-foreground cursor-pointer transition mx-1 rounded'
          ]"
          @click="handleEmbed"
          @keypress="keyboardClick(handleEmbed)"
        >
          Embed model
        </div>
      </MenuItem>
    </MenuItems>

    <ProjectModelPageDialogEmbed v-model:open="embedDialogOpen" :project="project" />
  </Menu>
</template>
<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { ShareIcon } from '@heroicons/vue/24/outline'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/20/solid'
import { SpeckleViewer } from '@speckle/shared'
import { keyboardClick } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql/gql'
import type { HeaderNavShare_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { useCopyModelLink } from '~~/lib/projects/composables/modelManagement'

graphql(`
  fragment HeaderNavShare_Project on Project {
    id
    visibility
    ...ProjectsModelPageEmbed_Project
  }
`)

const props = defineProps<{
  project: HeaderNavShare_ProjectFragment
  resourceIdString: string
}>()

const { copy } = useClipboard()
const copyModelLink = useCopyModelLink()
const menuButtonId = useId()

const embedDialogOpen = ref(false)

const parsedResourceIds = computed(() =>
  SpeckleViewer.ViewerRoute.parseUrlParameters(props.resourceIdString)
)

const firstResource = computed(() => parsedResourceIds.value[0] || {})

const versionId = computed(() => {
  if (SpeckleViewer.ViewerRoute.isModelResource(firstResource.value)) {
    return firstResource.value.versionId
  }
  return ''
})

const modelId = computed(() => {
  if (SpeckleViewer.ViewerRoute.isModelResource(firstResource.value)) {
    return firstResource.value.modelId // Assuming your firstResource object has a modelId property
  }
  return ''
})

const isFederated = computed(() => parsedResourceIds.value.length > 1)

const handleCopyId = () => {
  copy(props.resourceIdString, { successMessage: 'ID copied to clipboard' })
}

const handleCopyLink = () => {
  const modelIdValue = modelId.value
  const versionIdValue = versionId.value ? versionId.value : undefined
  void copyModelLink({
    model: {
      projectId: props.project.id,
      id: modelIdValue
    },
    versionId: versionIdValue
  })
}

const handleEmbed = () => {
  embedDialogOpen.value = true
}
</script>
