<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <Menu as="div" class="flex items-center relative">
    <MenuButton :id="menuButtonId" as="div">
      <!-- Desktop Button -->
      <FormButton class="hidden sm:flex" :icon-right="ChevronDownIcon">
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
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <MenuItems
        class="absolute z-50 flex flex-col gap-1 right-0 sm:right-4 top-8 min-w-max w-full sm:w-32 py-1 origin-top-right bg-foundation outline outline-1 outline-primary-muted rounded-md shadow-lg overflow-hidden mt-1"
      >
        <MenuItem v-slot="{ active }">
          <div
            :class="[
              active ? 'bg-highlight-1' : '',
              'text-body-sm flex px-2 py-1.5 text-foreground cursor-pointer transition mx-1.5 rounded'
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
              'text-body-sm flex px-2 py-1.5 text-foreground cursor-pointer transition mx-1.5 rounded'
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
              'text-body-sm flex px-2 py-1.5 text-foreground cursor-pointer transition mx-1.5 rounded'
            ]"
            @click="handleEmbed"
            @keypress="keyboardClick(handleEmbed)"
          >
            Embed model
          </div>
        </MenuItem>
      </MenuItems>
    </Transition>
    <ProjectModelPageDialogEmbed v-model:open="embedDialogOpen" :project="project" />
  </Menu>
</template>
<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { ShareIcon } from '@heroicons/vue/24/outline'
import { ChevronDownIcon } from '@heroicons/vue/20/solid'
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
  copyModelLink(props.project.id, modelIdValue, versionIdValue)
}

const handleEmbed = () => {
  embedDialogOpen.value = true
}
</script>
