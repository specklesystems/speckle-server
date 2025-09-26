<template>
  <div>
    <div
      class="relative group flex flex-col items-stretch md:flex-row md:space-x-2 border border-outline-3 rounded-xl p-4 transition bg-foundation"
    >
      <div
        class="w-full md:w-56 flex flex-col justify-between col-span-3 lg:col-span-1 mb-4 md:mb-0 flex-shrink-0 space-y-1 pl-2 pr-6 py-2"
      >
        <div class="flex flex-col">
          <CommonBadge
            v-if="!project.workspace?.id && isWorkspacesEnabled && isOwner"
            v-tippy="'As the project owner you can move this project to a workspace'"
            class="mb-2 max-w-max"
            rounded
          >
            Ready to move
          </CommonBadge>
          <NuxtLink
            :to="projectRoute(project.id)"
            class="break-words hover:text-primary text-heading mb-2"
          >
            {{ project.name }}
          </NuxtLink>
          <span
            v-tippy="updatedAt.full"
            class="text-body-3xs mb-1 text-foreground-2 select-none"
          >
            Updated
            {{ updatedAt.relative }}
          </span>
          <span
            v-if="project.role"
            class="text-body-3xs capitalize mb-2 text-foreground-2 select-none"
          >
            {{ RoleInfo.Stream[project.role as StreamRoles].title }}
          </span>
          <UserAvatarGroup :users="teamUsers" :max-count="2" />
        </div>
        <div class="pt-3">
          <NuxtLink
            v-if="project.workspace && showWorkspaceLink && isWorkspacesEnabled"
            :to="workspaceRoute(project.workspace.slug)"
            class="my-3 flex items-center"
          >
            <WorkspaceAvatar
              :logo="project.workspace.logo"
              :name="project.workspace.name"
              size="sm"
            />
            <p class="text-body-2xs text-foreground ml-2 line-clamp-2">
              {{ project.workspace.name }}
            </p>
          </NuxtLink>
          <div class="flex gap-2">
            <FormButton
              :to="allProjectModelsRoute(project.id) + '/'"
              size="sm"
              color="outline"
              :icon-right="ChevronRight"
            >
              {{
                `${modelItemTotalCount} ${
                  modelItemTotalCount === 1 ? 'model' : 'models'
                }`
              }}
            </FormButton>
            <div
              v-if="!project.workspace?.id && isWorkspacesEnabled"
              v-tippy="
                !isOwner
                  ? 'Only the project owner can move this project into a workspace'
                  : undefined
              "
            >
              <FormButton
                size="sm"
                color="outline"
                :disabled="!isOwner"
                @click="$emit('moveProject')"
              >
                Move project
              </FormButton>
            </div>
          </div>
        </div>
      </div>
      <div :class="gridClasses">
        <template v-if="!isModelUploading">
          <ProjectPageModelsCard
            v-for="pendingModel in pendingModels"
            :key="pendingModel.id"
            :model="pendingModel"
            :project="project"
            show-versions
            :project-id="project.id"
            height="h-48"
            show-actions
          />
          <ProjectPageModelsCard
            v-for="model in models"
            :key="model.id"
            :model="model"
            :project="project"
            show-versions
            show-actions
            :project-id="project.id"
            height="h-48"
            @click="router.push(getModelItemRoute(model))"
          />
        </template>
        <ProjectCardImportFileArea
          v-if="hasNoModels || isModelUploading"
          empty-state-variant="modelsSection"
          :project="project"
          class="h-28 col-span-4"
          @uploading="onModelUploading"
        />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { Roles } from '@speckle/shared'
import { FormButton } from '@speckle/ui-components'
import type { ProjectDashboardItemFragment } from '~~/lib/common/generated/gql/graphql'
import { projectRoute, allProjectModelsRoute } from '~~/lib/common/helpers/route'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import { ChevronRight } from 'lucide-vue-next'
import { workspaceRoute } from '~/lib/common/helpers/route'
import { RoleInfo, type StreamRoles } from '@speckle/shared'
import type { FileAreaUploadingPayload } from '~/lib/form/helpers/fileUpload'
import { getModelItemRoute } from '~/lib/projects/helpers/models'

defineEmits<{
  (e: 'moveProject'): void
}>()

const props = defineProps<{
  project: ProjectDashboardItemFragment
  showWorkspaceLink?: boolean
  workspacePage?: boolean
}>()

const router = useRouter()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const { formattedRelativeDate, formattedFullDate } = useDateFormatters()

const isModelUploading = ref(false)

const isOwner = computed(() => props.project.role === Roles.Stream.Owner)
const projectId = computed(() => props.project.id)
const updatedAt = computed(() => {
  return {
    full: formattedFullDate(props.project.updatedAt),
    relative: formattedRelativeDate(props.project.updatedAt, { prefix: true })
  }
})

// Tracking updates to project, its models and versions
useGeneralProjectPageUpdateTracking(
  { projectId },
  { redirectHomeOnProjectDeletion: false }
)

const teamUsers = computed(() => props.project.team.map((t) => t.user))
const pendingModels = computed(() => props.project.pendingImportedModels)
const models = computed(() => {
  const items = props.project.models?.items || []
  return items.slice(0, Math.max(0, 3 - pendingModels.value.length))
})

const hasNoModels = computed(() => !models.value.length && !pendingModels.value.length)
const modelItemTotalCount = computed(
  () => props.project.models.totalCount + pendingModels.value.length
)

const gridClasses = computed(() => [
  // Base classes
  'grid',
  'gap-2',
  'flex-grow',
  'col-span-4',
  'xl:col-span-3',
  'w-full',

  // Grid columns
  'grid-cols-1',
  'sm:grid-cols-2',
  props.workspacePage && 'lg:grid-cols-1',
  props.workspacePage ? 'xl:grid-cols-2' : 'xl:grid-cols-3',
  props.workspacePage && '2xl:grid-cols-3',

  // Visibility rules
  'sm:[&>*:nth-child(n+3)]:hidden',
  props.workspacePage && 'lg:[&>*:nth-child(n+2)]:hidden',
  props.workspacePage && 'xl:[&>*:nth-child(n+2)]:block',
  !props.workspacePage && 'xl:[&>*:nth-child(n+3)]:block',
  props.workspacePage && '2xl:[&>*:nth-child(n+2)]:block',
  '2xl:[&>*:nth-child(n+3)]:block'
])

const onModelUploading = (payload: FileAreaUploadingPayload) => {
  isModelUploading.value = payload.isUploading
}
</script>
