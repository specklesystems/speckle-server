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
      <AutomateFunctionPageInfoBlock :icon="InformationCircleIcon" title="Info">
        <div class="space-y-3">
          <div v-if="latestRelease">
            <span>Last published:&nbsp;</span>
            <CommonText class="font-bold" :text="publishedAt" />
          </div>
          <div>
            <span>Used by:&nbsp;</span>
            <CommonText class="font-bold" :text="`${fn.automationCount} automations`" />
          </div>
          <CommonTextLink
            v-if="latestRelease?.inputSchema"
            :icon-right="ArrowTopRightOnSquareIcon"
            @click="onViewParameters"
          >
            View Parameters
          </CommonTextLink>
        </div>
      </AutomateFunctionPageInfoBlock>
    </div>
    <AutomateFunctionPageInfoBlock
      title="Description"
      :rounded-bottom="false"
      :icon="IconNotes"
    >
      <CommonProseMarkdownDescription :markdown="description" />
    </AutomateFunctionPageInfoBlock>
    <AutomateFunctionPageParametersDialog
      v-if="latestRelease"
      v-model:open="showParamsDialog"
      :release="latestRelease"
    />
  </div>
</template>
<script setup lang="ts">
import {
  CodeBracketIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'
import {
  useGetGithubRepo,
  useResolveGitHubRepoFromUrl
} from '~/lib/automate/composables/github'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateFunctionPageInfo_AutomateFunctionFragment } from '~/lib/common/generated/gql/graphql'
import IconNotes from '~~/components/global/icon/Notes.vue'

graphql(`
  fragment AutomateFunctionPageInfo_AutomateFunction on AutomateFunction {
    id
    repoUrl
    automationCount
    description
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

const showParamsDialog = ref(false)

const license = computed(() => githubDetails.value?.license?.name)
const latestRelease = computed(() =>
  props.fn.releases.items.length ? props.fn.releases.items[0] : undefined
)
const publishedAt = computed(() => dayjs(latestRelease.value?.createdAt).from(dayjs()))
const description = computed(() =>
  props.fn.description?.length ? 'No description provided.' : props.fn.description
)

const onViewParameters = () => {
  if (!latestRelease.value) return
  showParamsDialog.value = true
}
</script>
