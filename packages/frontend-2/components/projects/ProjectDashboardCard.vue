<template>
  <div>
    <div
      class="relative group flex flex-col items-stretch md:flex-row md:space-x-2 border border-outline-3 rounded-xl p-4 transition bg-foundation"
    >
      <div
        class="w-full md:w-48 flex flex-col justify-between col-span-3 lg:col-span-1 mb-4 md:mb-0 flex-shrink-0 space-y-1 pl-2 pr-6 py-2"
      >
        <div class="flex flex-col">
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
          <span class="text-body-3xs capitalize mb-2 text-foreground-2 select-none">
            {{ project.role?.split(':').reverse()[0] }}
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
              :default-logo-index="project.workspace.defaultLogoIndex"
              size="sm"
            />
            <p class="text-body-2xs text-foreground ml-2 line-clamp-2">
              {{ project.workspace.name }}
            </p>
          </NuxtLink>
          <FormButton
            :to="allProjectModelsRoute(project.id) + '/'"
            size="sm"
            color="outline"
            :icon-right="ChevronRightIcon"
          >
            {{
              `${modelItemTotalCount} ${modelItemTotalCount === 1 ? 'model' : 'models'}`
            }}
          </FormButton>
        </div>
      </div>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 flex-grow col-span-4 xl:col-span-3 w-full sm:[&>*:nth-child(2)]:hidden xl:[&>*:nth-child(2)]:block"
      >
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
          @click="router.push(modelRoute(project.id, model.id))"
        />
        <ProjectCardImportFileArea
          v-if="hasNoModels"
          :project-id="project.id"
          class="h-28 col-span-4"
        />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { FormButton } from '@speckle/ui-components'
import type { ProjectDashboardItemFragment } from '~~/lib/common/generated/gql/graphql'
import {
  projectRoute,
  allProjectModelsRoute,
  modelRoute
} from '~~/lib/common/helpers/route'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import { ChevronRightIcon } from '@heroicons/vue/20/solid'
import { workspaceRoute } from '~/lib/common/helpers/route'

const props = defineProps<{
  project: ProjectDashboardItemFragment
  showWorkspaceLink?: boolean
}>()

const router = useRouter()
const isWorkspacesEnabled = useIsWorkspacesEnabled()

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
</script>
