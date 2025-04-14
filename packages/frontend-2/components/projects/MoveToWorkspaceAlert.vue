<template>
  <div>
    <CommonCard class="!p-3 !bg-foundation mb-4">
      <div class="flex flex-col sm:flex-row sm:gap-2 text-foreground">
        <ExclamationCircleIcon class="h-8 w-8 m-1 text-warning shrink-0" />
        <div class="flex flex-col gap-4">
          <h3 class="text-heading mt-2">
            {{
              projectId
                ? `Move this project to a workspace or it will be deleted in (count) days.`
                : `Move projects to a workspace or they will be deleted in (count) days.`
            }}
          </h3>

          <div class="text-body-xs max-w-3xl">
            <p>
              In our continuous effort to improve user experience, we are excited to
              announce the rollout of several new features designed to simplify your
              workflow and enhance navigation. Important facts:
            </p>
            <ul class="list-disc list-inside pl-2">
              <li>These updates will include customizable dashboards,</li>
              <li>Improved search functionality,</li>
              <li>And a more user-friendly interface</li>
            </ul>
          </div>

          <div class="flex gap-2 mt-2 mb-3">
            <FormButton @click="$emit('moveProject', projectId)">
              {{ projectId ? 'Move project' : 'Show projects to move' }}
            </FormButton>
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
  </div>
</template>

<script setup lang="ts">
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { LearnMoreMoveProjectsUrl } from '~/lib/common/helpers/route'

defineEmits(['moveProject'])

defineProps<{
  projectId?: string
}>()
</script>
