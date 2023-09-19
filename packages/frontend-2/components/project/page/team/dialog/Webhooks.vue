<template>
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
  </div>
</template>
<script setup lang="ts">
import { ProjectPageTeamDialogFragment } from '~~/lib/common/generated/gql/graphql'
import { LockClosedIcon } from '@heroicons/vue/24/solid'
import { useRouter } from 'vue-router'

defineProps<{
  project: ProjectPageTeamDialogFragment
}>()

const router = useRouter()
</script>
