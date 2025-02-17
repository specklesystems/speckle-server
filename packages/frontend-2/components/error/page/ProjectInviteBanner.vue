<template>
  <NuxtErrorBoundary @error="onError">
    <ProjectsInviteBanner
      v-if="invite"
      :invite="invite"
      :show-project-name="false"
      @processed="onProcessed"
    />
  </NuxtErrorBoundary>
</template>
<script setup lang="ts">
import type { Optional } from '@speckle/shared'
import { useQuery } from '@vue/apollo-composable'
import { projectRoute } from '~~/lib/common/helpers/route'
import { projectInviteQuery } from '~~/lib/projects/graphql/queries'

const route = useRoute()
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

  if (accepted && projectId.value && import.meta.client) {
    window.location.href = projectRoute(projectId.value)
  }
}
</script>
