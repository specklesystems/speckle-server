<template>
  <div class="flex flex-col gap-6">
    <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
                class="ml-1 w-6 h-6 rounded-full"
              />
            </CommonTextLink>
          </div>
        </div>
      </AutomateFunctionPageInfoBlock>
      <AutomateFunctionPageInfoBlock :icon="InformationCircleIcon" title="Info">
        <div class="gap-y-2 text-body-sm">
          <div v-if="latestRelease">
            <span>Last published:&nbsp;</span>
            <CommonText class="font-medium" :text="publishedAt" />
          </div>
          <div>
            <span>Used by:&nbsp;</span>
            <CommonText
              class="font-medium"
              :text="`${fn.automationCount} automations`"
            />
          </div>
          <CommonTextLink
            v-if="latestRelease?.inputSchema"
            :icon-right="ArrowTopRightOnSquareIcon"
            @click="onViewParameters"
          >
            View parameters
          </CommonTextLink>
        </div>
      </AutomateFunctionPageInfoBlock>
    </div>
    <AutomateFunctionPageInfoBlock
      title="Description"
      :icon="ChatBubbleBottomCenterTextIcon"
    >
      <CommonProseMarkdownDescription :markdown="description" />
    </AutomateFunctionPageInfoBlock>
    <AutomateFunctionPageInfoBlock title="Readme" :icon="BookOpenIcon">
      <CommonProseGithubReadme
        :readme-markdown="rawReadme || ''"
        :repo="repo || ''"
        :commit-id="selectedReleaseCommitId"
      />
    </AutomateFunctionPageInfoBlock>
    <div
      class="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center"
    >
      <div>
        <div class="text-heading-lg mb-2">Ready to go?</div>
        <div class="label-light text-foreground-2 text-body-xs">
          Use this function to create an automation on your project.
        </div>
      </div>
      <div
        v-tippy="
          hasReleases ? undefined : 'Your function needs to have at least one release'
        "
        class="shrink-0"
      >
        <FormButton
          :icon-left="BoltIcon"
          class="shrink-0"
          :disabled="!hasReleases"
          @click="$emit('createAutomation')"
        >
          Use in an automation
        </FormButton>
      </div>
    </div>
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
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  BoltIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'
import {
  useGetGithubRepo,
  useGetRawGithubReadme,
  useResolveGitHubRepoFromUrl
} from '~/lib/automate/composables/github'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateFunctionPageInfo_AutomateFunctionFragment } from '~/lib/common/generated/gql/graphql'

// TODO: Responsivity everywhere

graphql(`
  fragment AutomateFunctionPageInfo_AutomateFunction on AutomateFunction {
    id
    repo {
      id
      url
      owner
      name
    }
    automationCount
    description
    releases(limit: 1) {
      items {
        id
        inputSchema
        createdAt
        commitId
        ...AutomateFunctionPageParametersDialog_AutomateFunctionRelease
      }
    }
  }
`)

defineEmits<{
  createAutomation: []
}>()

const props = defineProps<{
  fn: AutomateFunctionPageInfo_AutomateFunctionFragment
}>()

const repoUrl = computed(() => props.fn.repo.url)
const latestRelease = computed(() =>
  props.fn.releases.items.length ? props.fn.releases.items[0] : undefined
)
const selectedReleaseCommitId = computed(() => latestRelease.value?.commitId)

const { repo } = useResolveGitHubRepoFromUrl(repoUrl)
const { data: githubDetails } = useGetGithubRepo(computed(() => repo.value || ''))
const { data: rawReadme } = useGetRawGithubReadme(
  computed(() => repo.value || ''),
  selectedReleaseCommitId
)

const showParamsDialog = ref(false)

const license = computed(() => githubDetails.value?.license?.name)

const publishedAt = computed(() => dayjs(latestRelease.value?.createdAt).from(dayjs()))
const description = computed(() =>
  props.fn.description?.length ? props.fn.description : 'No description provided.'
)
const hasReleases = computed(() => !!latestRelease.value)

const onViewParameters = () => {
  if (!latestRelease.value) return
  showParamsDialog.value = true
}
</script>
