<template>
  <NuxtErrorBoundary @error="onError">
    <ProjectsInviteBanner
      v-if="invite"
      :invite="invite"
      :show-stream-name="false"
      @processed="onProcessed"
    />
  </NuxtErrorBoundary>
</template>
<script setup lang="ts">
import { Optional } from '@speckle/shared'
import { useQuery } from '@vue/apollo-composable'
import { useNavigateToProject } from '~~/lib/common/helpers/route'
import { projectInviteQuery } from '~~/lib/projects/graphql/queries'

const route = useRoute()
const goToProject = useNavigateToProject()
const logger = useLogger()

const token = computed(() => route.query.token as Optional<string>)
const projectId = computed(() => route.params.id as Optional<string>)

const { result } = useQuery(
  projectInviteQuery,
  () => ({
    projectId: projectId.value || '',
    token: token.value
  }),
  () => ({ enabled: !!projectId.value })
)

const invite = computed(() => result.value?.projectInvite)

const onError = (err: unknown) => logger.error(err)

const onProcessed = (val: { accepted: boolean }) => {
  const { accepted } = val

  if (accepted && projectId.value && process.client) {
    goToProject({ id: projectId.value })
  }
}
</script>
