<template>
  <div>
    <CommonCard class="pb-6 !bg-foundation mb-6">
      <div class="flex flex-col sm:flex-row sm:gap-2 text-foreground">
        <ExclamationCircleIcon class="h-8 w-8 m-1 text-warning shrink-0" />
        <div class="flex flex-col gap-4">
          <h3 class="text-heading mt-2">
            {{
              projectId
                ? `Move this project to a workspace`
                : `Move your projects to a workspace`
            }}
          </h3>

          <div class="text-body-xs">
            <p class="mb-4">
              How you work in Speckle is changing. We are
              <span class="text-warning-darker align-top text-body">➊</span>
              making workspaces the default way to work in Speckle, and
              <span class="text-warning-darker align-top text-body">➋</span>
              introducing new pricing including limits to the free plan.
            </p>

            <div v-show="!hasCollapsedLegacyProjectsExplainer" class="mb-3">
              <h3 class="font-medium text-warning-darker">By June 1st 2025</h3>
              <p>Move your projects to a workspace to:</p>
              <ul class="list-disc list-inside pl-2 mb-4">
                <li>
                  <span class="font-medium">Create new projects and models</span>
                  (will be disabled for personal projects; existing projects and models
                  stay editable)
                </li>
                <li>
                  <span class="font-medium">Invite new project collaborators</span>
                  (new invites will be unavailable for personal projects)
                </li>
                <li>
                  <span class="font-medium">Preserve version and comment history</span>
                  (history is reduced to 7 days for personal projects)
                </li>
              </ul>
              <h3 class="font-medium text-warning-darker">By Janury 1st 2026</h3>
              <p>
                All projects will be archived if not moved into a workspace. Don't
                worry, we'll give you plenty of reminders before then.
              </p>
            </div>

            <FormButton
              text
              color="primary"
              size="sm"
              class="mb-5"
              :icon-right="
                hasCollapsedLegacyProjectsExplainer ? ChevronUpIcon : ChevronDownIcon
              "
              @click="handleToggleExpand"
            >
              {{ hasCollapsedLegacyProjectsExplainer ? 'Show less' : 'Show more' }}
            </FormButton>

            <div class="flex gap-2">
              <div
                v-tippy="
                  disableButton ? 'You must be the owner of the project' : undefined
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
                Explore new pricing
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
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/20/solid'
import { useActiveUserMeta } from '~/lib/user/composables/meta'
defineEmits(['moveProject'])

defineProps<{
  projectId?: string
  disableButton?: boolean
}>()

const { hasCollapsedLegacyProjectsExplainer, updateLegacyProjectsExplainerCollapsed } =
  useActiveUserMeta()

const handleToggleExpand = () => {
  updateLegacyProjectsExplainerCollapsed(!hasCollapsedLegacyProjectsExplainer.value)
}
</script>
