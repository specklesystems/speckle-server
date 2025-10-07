<template>
  <div>
    <CommonCard class="pb-6 !bg-foundation mb-6">
      <div class="flex flex-col sm:flex-row sm:gap-2 text-foreground">
        <ExclamationCircleIcon class="h-8 w-8 m-1 text-warning shrink-0" />
        <div class="flex flex-col gap-3">
          <h3 class="text-heading mt-2">
            {{
              projectId
                ? `Move this project to a workspace`
                : `Move your projects to a workspace`
            }}
          </h3>

          <div class="text-body-xs">
            <div class="mb-4">
              Personal projects are being phased out. Move your projects to a workspace
              to create new projects and models, invite new project collaborators, and
              view comments and versions older than 7 days. By January 1st 2026, all
              projects will be deleted if not moved into a workspace.
            </div>
            <div class="flex gap-2">
              <div
                v-tippy="
                  disableButton
                    ? 'Only the project owner can move this project into a workspace'
                    : undefined
                "
              >
                <FormButton
                  :disabled="disableButton"
                  @click="$emit('moveProject', projectId)"
                >
                  {{ projectId ? 'Move project' : 'Move projects' }}
                </FormButton>
              </div>
              <FormButton
                color="outline"
                :to="LearnMoreMoveProjectsUrl"
                external
                target="_blank"
              >
                View pricing
              </FormButton>
            </div>
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
  disableButton?: boolean
}>()
</script>
