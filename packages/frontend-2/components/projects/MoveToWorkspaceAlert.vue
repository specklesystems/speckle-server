<template>
  <CommonCard class="!p-3 !bg-foundation">
    <div class="flex gap-2 text-foreground">
      <ExclamationCircleIcon class="h-8 w-8 m-1 text-warning" />
      <div class="flex flex-col gap-4">
        <h3 class="text-heading mt-2">
          {{
            projectId
              ? `Move the project to a workspace or it will be deleted in ${daysLeft} days.`
              : `Move projects to a workspace or they will be deleted in ${daysLeft} days.`
          }}
        </h3>

        <div class="text-body-xs max-w-3xl">
          <p>
            In our continuous effort to improve user experience, we are excited to
            announce the rollout of several new features designed to simplify your
            workflow and enhance navigation. Important facts:
          </p>
          <ul class="list-disc list-inside pl-1">
            <li>These updates will include customizable dashboards,</li>
            <li>Improved search functionality,</li>
            <li>And a more user-friendly interface</li>
          </ul>
        </div>

        <div class="flex gap-2 mt-2 mb-3">
          <FormButton v-if="projectId">Move project</FormButton>
          <FormButton v-else>Show projects to move</FormButton>
          <FormButton
            color="outline"
            :to="LearnMoreMoveProjectsUrl"
            external
            target="_blank"
          >
            Learn more
          </FormButton>
        </div>
      </div>
    </div>
  </CommonCard>
</template>

<script setup lang="ts">
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { LearnMoreMoveProjectsUrl } from '~/lib/common/helpers/route'

defineProps<{
  projectId?: string
  daysLeft: number
}>()
</script>
