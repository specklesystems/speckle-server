<template>
  <div class="flex flex-col">
    <div class="relative bg-primary h-48 select-none">
      <div
        class="bg-foundation dark:bg-foundation-2 w-full relative border-b border-outline-2 h-full overflow-clip flex justify-center"
      >
        <div
          class="z-2 absolute -top-40 left-auto transform rotate-45 rounded-full p-40 border-[150px] border-b-white border-l-indigo-600 dark:border-l-indigo-400 border-r-rose-900 dark:border-r-rose-500 border-t-white blur-[200px]"
        ></div>

        <div
          class="absolute shadow-2xl rounded-md my-8 p-2 gap-2 flex align-middle top-0 border z-55 w-80 h-full bg-foundation border-outline-2"
        >
          <WorkspaceAvatar name="My workspace" logo="" />
          <span
            class="h-[30px] flex place-items-center text-foreground-3 text-body-3xs font-medium"
          >
            My workspace
          </span>
        </div>
        <ul
          class="relative m-0 list-none h-[204px] w-[302px] my-20 p-0 border border-outline-2 flex bg-foundation-page justify-center rounded-md"
        >
          <li class="absolute z-65 justify-center rounded-md p-2 w-full">
            <div class="flex justify-between w-full gap-2 h-20">
              <div
                class="absolute h-20 w-[90px] card-slide-in border border-outline-2 bg-foundation rounded-md p-4 place-items-center flex-1"
              >
                <IllustrationProjectShape />
              </div>
              <div
                class="border border-outline-5 border-dashed bg-foundation-2 rounded-md p-4 flex-1 place-items-center"
              ></div>
              <div class="border border-outline-2 bg-foundation rounded-md p-4 flex-1">
                <IllustrationProjectShape class="rotate-180" />
              </div>
              <div class="border border-outline-2 bg-foundation rounded-md p-4 flex-1">
                <IllustrationProjectShape class="rotate-90" />
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div class="w-full bg-foundation-page flex flex-col gap-6 p-6">
      <div class="flex flex-col gap-y-4 select-none">
        <h4 class="text-heading-sm text-foreground">
          <template v-if="!limitType">Move your projects to a workspace to:</template>
          <template v-else-if="limitType === ViewerLimitsDialogType.Version">
            Personal projects limit reached
          </template>
          <template v-else-if="limitType === ViewerLimitsDialogType.Federated">
            The federated models couldn't be loaded
          </template>
        </h4>
        <template v-if="!limitType">
          → Create new projects and models,
          <br />
          → Invite new project collaborators,
          <br />
          → View comments and versions older than {{ versionLimitFormatted }} (paid
          plans only)
        </template>
        <template v-else-if="limitType === ViewerLimitsDialogType.Version">
          The version you're trying to load is older than the
          {{ versionLimitFormatted }} version history limit allowed for Personal
          projects. Move your project to a workspace to gain access.
        </template>
        <template v-else-if="limitType === ViewerLimitsDialogType.Federated">
          One of the models is older than the {{ versionLimitFormatted }} version
          history limit allowed for Personal projects. Move your project to a workspace
          to gain access.
        </template>
      </div>
      <CommonAlert v-if="isNotOwner" color="warning" hide-icon>
        <template #title>
          You can't move the project because you're not a project owner.
        </template>
      </CommonAlert>
      <div class="flex gap-2 justify-end">
        <FormButton v-if="!limitType" color="subtle" @click="$emit('cancel')">
          Cancel
        </FormButton>
        <FormButton v-else color="subtle" @click="loadLatestVersion">
          Load latest version
        </FormButton>
        <div
          v-tippy="
            canMoveProject?.authorized || isNotOwner ? '' : canMoveProject?.message
          "
        >
          <FormButton
            :disabled="!canMoveProject?.authorized"
            @click="$emit('continue')"
          >
            Move project
          </FormButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError
} from '@speckle/shared/authz'
import type { WorkspaceMoveProjectManager_ProjectFragment } from '~/lib/common/generated/gql/graphql'
import { usePersonalProjectLimits } from '~/lib/projects/composables/permissions'
import { ViewerLimitsDialogType } from '~/lib/projects/helpers/limits'
import { useLoadLatestVersion } from '~/lib/viewer/composables/resources'

defineEmits<{
  cancel: []
  continue: []
}>()

const props = defineProps<{
  project?: MaybeNullOrUndefined<WorkspaceMoveProjectManager_ProjectFragment>
  limitType?: ViewerLimitsDialogType
}>()

const route = useRoute()
const canMoveProject = computed(() => props.project?.permissions?.canMoveToWorkspace)
const { load: loadLatestVersion } = useLoadLatestVersion({
  project: computed(() => props.project),
  resourceIdString: computed(() => route.params.modelId as string) // this should only be opened in the viewer anyway
})
const { versionLimitFormatted } = usePersonalProjectLimits()

const isNotOwner = computed(() => {
  const check = canMoveProject.value
  if (!check) return true // if no permission check, assume not owner

  return (
    !check.authorized &&
    (
      [ProjectNotEnoughPermissionsError.code, ProjectNoAccessError.code] as string[]
    ).includes(check.code)
  )
})
</script>
<style scoped>
.card-slide-in {
  animation: 2s slide-in-right ease-in-out forwards;
  top: 8px;
  left: -8px;
  transform-origin: bottom left;
}

@keyframes slide-in-right {
  0% {
    transform: translateY(0) translateX(0) rotate(-20deg) scale(1.5);
    opacity: 0;
  }

  100% {
    transform: translateY(0) translateX(16px) rotate(0deg) scale(1);
    opacity: 1;
  }
}
</style>
