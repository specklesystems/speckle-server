<template>
  <div>
    <div v-if="project" class="mb-8">
      <!-- Not working yet -->
      <Portal to="navigation">
        <HeaderNavLink
          :to="projectRoute(project.id)"
          :name="project.name"
        ></HeaderNavLink>
      </Portal>
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Webhooks</h1>
        <div class="flex gap-2">
          <FormButton color="secondary" :icon-left="BookOpenIcon">Open Docs</FormButton>
          <FormButton :icon-left="PlusIcon" @click="showDialog = true">
            Create Webhook
          </FormButton>
        </div>
      </div>
      <div class="mt-8 text-xs">
        Webhooks allow you to subscribe to a stream's events and get notified of them in
        real time. You can then use this to trigger ci apps, automation workflows, and
        more.
      </div>
    </div>
    <ProjectWebhooksPageTable />
    <ProjectWebhooksPageDialogCreateWebhook
      v-model:open="showDialog"
      :url="urlValue"
      :name="nameValue"
      :secret="secretValue"
    />
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { Optional } from '@speckle/shared'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'
import { projectRoute } from '~~/lib/common/helpers/route'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import { BookOpenIcon, PlusIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: ['require-valid-project']
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)

useGeneralProjectPageUpdateTracking({ projectId }, { notifyOnProjectUpdate: true })

const showDialog = ref(false)

const urlValue = ref('')
const nameValue = ref('')
const secretValue = ref('')

const { result: projectPageResult } = useQuery(
  projectPageQuery,
  () => ({
    id: projectId.value,
    token: (route.query.token as Optional<string>) || null
  }),
  () => ({
    // Custom error policy so that a failing invitedTeam resolver (due to access rights)
    // doesn't kill the entire query
    errorPolicy: 'all'
  })
)

const project = computed(() => projectPageResult.value?.project)
</script>
