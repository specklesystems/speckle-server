<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div
    class="group rounded-md bg-foundation shadow transition hover:scale-[1.02] border-2 border-transparent hover:border-outline-2 hover:shadow-xl"
    @mouseleave="showActionsMenu = false"
  >
    <!--
      Nested anchors are causing a hydration mismatch for some reason (template renders wrong in SSR), could be a Vue bug?
      TODO: Report it to Vue/Nuxt!
    -->
    <NuxtLink
      :href="disableDefaultLink ? undefined : modelRoute(projectId, model.id)"
      class="cursor-pointer"
      @click="$emit('click', $event)"
    >
      <div :class="`${height} flex items-center justify-center`">
        <PreviewImage v-if="model.previewUrl" :preview-url="model.previewUrl" />
        <div v-else class="h-full w-full p-4">
          <div
            class="rounded-xl p-4 flex items-center h-full w-full border-dashed border-2 border-blue-500/10 text-foreground-2 text-xs text-center"
          >
            <div :class="`opacity-50 group-hover:opacity-100`">
              Use our
              <b>connectors</b>
              to send data to this model, or drag and drop a IFC/OBJ/STL file here.
            </div>
          </div>
        </div>
      </div>
      <div class="h-12 flex items-center px-2 py-1 space-x-1">
        <div class="flex-grow">
          <div v-if="path" class="text-xs text-foreground-2 relative -mb-1 truncate">
            {{ path }}
          </div>
          <div class="font-bold truncate">{{ model.displayName }}</div>
        </div>

        <div
          :class="`text-xs text-foreground-2 mr-1 opacity-0 truncate transition group-hover:opacity-100`"
        >
          updated
          <b>{{ updatedAt }}</b>
        </div>

        <FormButton
          v-if="showVersions"
          rounded
          size="xs"
          :icon-left="ArrowPathRoundedSquareIcon"
          :to="modelVersionsRoute(projectId, model.id)"
          :class="`opacity-0 group-hover:opacity-100`"
          :disabled="model.versionCount === 0"
        >
          {{ model?.versionCount }}
        </FormButton>
        <LayoutMenu
          v-if="showActions"
          v-model:open="showActionsMenu"
          :items="actionsItems"
          @click.stop.prevent
          @chosen="onActionChosen"
        >
          <!-- TODO with proper disclosure menu or whatever -->
          <FormButton size="sm" text @click="showActionsMenu = !showActionsMenu">
            <EllipsisVerticalIcon class="w-4 h-4" />
          </FormButton>
        </LayoutMenu>
      </div>
    </NuxtLink>
    <ProjectPageModelsCardRenameDialog
      v-model:open="isRenameDialogOpen"
      :model="model"
      :project-id="projectId"
    />
    <ProjectPageModelsCardDeleteDialog
      v-model:open="isDeleteDialogOpen"
      :model="model"
      :project-id="projectId"
    />
  </div>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs'
import { ProjectPageLatestItemsModelItemFragment } from '~~/lib/common/generated/gql/graphql'
import {
  ArrowPathRoundedSquareIcon,
  EllipsisVerticalIcon
} from '@heroicons/vue/24/solid'
import { modelRoute, modelVersionsRoute } from '~~/lib/common/helpers/route'
import { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { Nullable } from '@speckle/shared'
import { useCopyModelLink } from '~~/lib/projects/composables/modelManagement'

enum ActionTypes {
  Rename = 'rename',
  Delete = 'delete',
  Share = 'share'
}

defineEmits<{
  (e: 'click', val: MouseEvent): void
}>()

const props = withDefaults(
  defineProps<{
    model: ProjectPageLatestItemsModelItemFragment
    projectId: string
    showVersions?: boolean
    showActions?: boolean
    disableDefaultLink?: boolean
    height?: string
  }>(),
  {
    showVersions: true,
    showActions: true,
    height: 'h-64'
  }
)

const copyModelLink = useCopyModelLink()

const openDialog = ref(null as Nullable<ActionTypes>)
const showActionsMenu = ref(false)
const actionsItems = ref<LayoutMenuItem[][]>([
  [
    { title: 'Rename', id: ActionTypes.Rename },
    { title: 'Delete', id: ActionTypes.Delete }
  ],
  [{ title: 'Share', id: ActionTypes.Share }]
])

const path = computed(() => {
  const model = props.model
  if (model.name === model.displayName) return null

  return model.name.substring(0, model.name.length - model.displayName.length)
})

const updatedAt = computed(() => dayjs(props.model.updatedAt).from(dayjs()))
const isRenameDialogOpen = computed({
  get: () => openDialog.value === ActionTypes.Rename,
  set: (isOpen) => (openDialog.value = isOpen ? ActionTypes.Rename : null)
})
const isDeleteDialogOpen = computed({
  get: () => openDialog.value === ActionTypes.Delete,
  set: (isOpen) => (openDialog.value = isOpen ? ActionTypes.Delete : null)
})

const onActionChosen = (params: { item: LayoutMenuItem; event: MouseEvent }) => {
  const { item } = params

  switch (item.id) {
    case ActionTypes.Rename:
    case ActionTypes.Delete:
      openDialog.value = item.id
      break
    case ActionTypes.Share:
      copyModelLink(props.projectId, props.model.id)
      break
  }
}
</script>
