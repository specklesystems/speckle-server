<template>
  <Portal to="navigation">
    <HeaderNavLink :to="projectRoute(project.id)" :name="project.name"></HeaderNavLink>
  </Portal>
  <div class="flex flex-col space-y-4">
    <div class="flex justify-between items-center gap-8">
      <div class="h5 font-bold flex items-center space-x-2 mt-5 mb-4">
        <LockClosedIcon class="w-6 h-6" />
        <span>Webhooks</span>
      </div>
      <FormButton size="sm" @click="router.push(`/projects/${project.id}/webhooks`)">
        Manage Webhooks
      </FormButton>
    </div>

    <ProjectPageTeamDialogDangerZones
      v-if="isOwner || canLeaveProject"
      :project="project"
    />
  </div>
</template>
<script setup lang="ts">
import { ProjectPageTeamDialogFragment } from '~~/lib/common/generated/gql/graphql'
import { projectRoute } from '~~/lib/common/helpers/route'
import { useTeamDialogInternals } from '~~/lib/projects/composables/team'
import { LockClosedIcon } from '@heroicons/vue/24/solid'
import { useRouter } from 'vue-router'

const props = defineProps<{
  project: ProjectPageTeamDialogFragment
}>()

const { isOwner, canLeaveProject } = useTeamDialogInternals({
  props: toRefs(props)
})

const router = useRouter()
</script>
