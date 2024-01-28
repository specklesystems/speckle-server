<template>
  <Menu
    as="div"
    class="hidden sm:flex items-center relative border-r border-outline-1 pr-4"
  >
    <MenuButton as="div">
      <FormButton outlined :icon-right="ChevronDownIcon">Share</FormButton>
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
        class="absolute z-50 flex flex-col gap-1 right-4 top-12 w-full sm:w-44 p-1 origin-top-right bg-foundation-2 outline outline-2 outline-primary-muted rounded-md shadow-lg overflow-hidden text-sm"
      >
        <MenuItem v-slot="{ active }">
          <div
            :class="[
              active ? 'bg-foundation-focus' : '',
              'flex gap-2 items-center px-2 py-1.5 text-sm text-foreground cursor-pointer transition rounded'
            ]"
            @click="handleCopyLink"
            @keypress="keyboardClick(handleCopyLink)"
          >
            <LinkIcon class="w-5 h-5" />
            Copy Link
          </div>
        </MenuItem>
        <MenuItem v-if="!isFederated" v-slot="{ active }">
          <div
            :class="[
              active ? 'bg-foundation-focus' : '',
              'flex gap-2 items-center px-2 py-1.5 text-sm text-foreground cursor-pointer transition rounded'
            ]"
            @click="handleCopyId"
            @keypress="keyboardClick(handleCopyId)"
          >
            <FingerPrintIcon class="w-5 h-5" />
            Copy ID
          </div>
        </MenuItem>
        <MenuItem v-slot="{ active }">
          <div
            :class="[
              active ? 'bg-foundation-focus' : '',
              'flex gap-2 items-center px-2 py-1.5 text-sm text-foreground cursor-pointer transition rounded'
            ]"
            @click="handleEmbed"
            @keypress="keyboardClick(handleEmbed)"
          >
            <CodeBracketIcon class="w-5 h-5" />
            Embed Model
          </div>
        </MenuItem>
      </MenuItems>
    </Transition>
    <ProjectModelPageDialogEmbed
      v-model:open="embedDialogOpen"
      :project-id="projectId"
      :model-id="modelId"
      :visibility="visibility"
    />
  </Menu>
</template>
<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import {
  ChevronDownIcon,
  LinkIcon,
  FingerPrintIcon,
  CodeBracketIcon
} from '@heroicons/vue/24/outline'
import { SpeckleViewer } from '@speckle/shared'
import { keyboardClick } from '@speckle/ui-components'
import type { ProjectVisibility } from '~/lib/common/generated/gql/graphql'
import { useCopyModelLink } from '~~/lib/projects/composables/modelManagement'

const props = defineProps<{
  projectId: string
  resourceIdString: string
  visibility: ProjectVisibility
}>()

const { copy } = useClipboard()
const copyModelLink = useCopyModelLink()

const embedDialogOpen = ref(false)

const parsedResourceIds = computed(() =>
  SpeckleViewer.ViewerRoute.parseUrlParameters(props.resourceIdString)
)

const firstResource = computed(() => parsedResourceIds.value[0] || {})

const modelId = computed(() => {
  if (SpeckleViewer.ViewerRoute.isModelResource(firstResource.value)) {
    return firstResource.value.modelId
  }
  return ''
})

const isFederated = computed(() => parsedResourceIds.value.length > 1)

const handleCopyId = () => {
  copy(modelId.value, { successMessage: 'Model ID copied to clipboard' })
}

const handleCopyLink = () => {
  copyModelLink(props.projectId, props.resourceIdString)
}

const handleEmbed = () => {
  embedDialogOpen.value = true
}
</script>
