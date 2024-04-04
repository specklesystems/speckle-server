<template>
  <div class="flex flex-col gap-6">
    <div class="grid gap-4 grid-cols-2">
      <AutomateFunctionPageInfoBlock :icon="CodeBracketIcon" title="Source">
        <div class="space-y-1">
          <CommonTextLink
            v-tippy="license"
            external
            :to="repoUrl"
            target="_blank"
            :icon-right="ArrowTopRightOnSquareIcon"
            class="max-w-full"
          >
            <span class="truncate">{{ repo }}</span>
          </CommonTextLink>
          <div v-if="githubDetails" class="flex items-center space-x-1">
            <span>by</span>
            <CommonTextLink
              external
              :to="githubDetails.owner.html_url"
              target="_blank"
              :icon-right="ArrowTopRightOnSquareIcon"
              class="max-w-full"
            >
              <span class="truncate">
                {{ githubDetails.owner.login }}
              </span>
              <img
                :src="githubDetails.owner.avatar_url"
                alt="Github account icon"
                class="ml-1 w-6 h-6"
              />
            </CommonTextLink>
          </div>
        </div>
      </AutomateFunctionPageInfoBlock>
      <AutomateFunctionPageInfoBlock :icon="InformationCircleIcon" title="Info" />
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  CodeBracketIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/outline'
import {
  useGetGithubRepo,
  useResolveGitHubRepoFromUrl
} from '~/lib/automate/composables/github'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateFunctionPageInfo_AutomateFunctionFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment AutomateFunctionPageInfo_AutomateFunction on AutomateFunction {
    id
    repoUrl
    automationCount
    releases(limit: 1) {
      items {
        id
        inputSchema
        createdAt
      }
    }
  }
`)

const props = defineProps<{
  fn: AutomateFunctionPageInfo_AutomateFunctionFragment
}>()

const repoUrl = computed(() => props.fn.repoUrl)
const { repo } = useResolveGitHubRepoFromUrl(repoUrl)
const { data: githubDetails } = useGetGithubRepo(computed(() => repo.value || ''))
const license = computed(() => githubDetails.value?.license?.name)
</script>
