<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-center gap-0.5">
      <CheckCircleIcon class="h-9 w-9 text-success" />
      <span class="text-heading-lg">Success</span>
    </div>
    <div class="label-light">
      Your function is ready to go!
      <br />
      <CommonTextLink
        :icon-right="ArrowTopRightOnSquareIcon"
        external
        :to="repoLink"
        target="_blank"
      >
        Go to the repository
      </CommonTextLink>
      or
      <CommonTextLink
        :icon-right="ArrowTopRightOnSquareIcon"
        external
        :to="repoCodespaceLink"
        target="_blank"
      >
        edit in Codespace
      </CommonTextLink>
    </div>
    <CommonCodeOutput :rows="7" :content="cloneInstructions" />
  </div>
</template>
<script setup lang="ts">
import type { AutomateFunctionCreateDialogDoneStep_AutomateFunctionFragment } from '~~/lib/common/generated/gql/graphql'
import { CheckCircleIcon } from '@heroicons/vue/24/solid'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import { graphql } from '~/lib/common/generated/gql'
import {
  buildGithubRepoHttpCloneUrl,
  buildGithubRepoSshUrl
} from '~/lib/common/helpers/github'

graphql(`
  fragment AutomateFunctionCreateDialogDoneStep_AutomateFunction on AutomateFunction {
    id
    repo {
      id
      url
      owner
      name
    }
    ...AutomationsFunctionsCard_AutomateFunction
  }
`)

const props = defineProps<{
  createdFunction: AutomateFunctionCreateDialogDoneStep_AutomateFunctionFragment
}>()

const repoCodespaceLink = computed(() => {
  const { owner, name } = props.createdFunction.repo
  return `https://codespaces.new/${owner}/${name}`
})

const repoLink = computed(() => props.createdFunction.repo.url)

const cloneInstructions = computed(() => {
  const repo = props.createdFunction.repo

  const htmlUrl = buildGithubRepoHttpCloneUrl(repo)
  const sshUrl = buildGithubRepoSshUrl(repo)

  return `# Clone the repository using SSH (recommended)
git clone ${sshUrl}

# Or using HTTPS
git clone ${htmlUrl}`
})
</script>
