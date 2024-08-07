<template>
  <NuxtErrorBoundary @error="onError">
    <ProjectsInviteBanner
      v-if="invite"
      :invite="invite"
      :show-stream-name="false"
      block
      @processed="onProcessed"
    />
    <ErrorPageGenericUnauthorizedBlock v-else />
  </NuxtErrorBoundary>
</template>
<script setup lang="ts">
import { waitForever, type Optional } from '@speckle/shared'
import { useQuery } from '@vue/apollo-composable'
import { projectRoute, useNavigateToHome } from '~/lib/common/helpers/route'
import { projectInviteQuery } from '~~/lib/projects/graphql/queries'

const route = useRoute()
const logger = useLogger()
const goHome = useNavigateToHome()

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

const onProcessed = async (val: { accepted: boolean }) => {
  if (!import.meta.client) return
  const { accepted } = val

  if (accepted) {
    if (projectId.value) {
      window.location.href = projectRoute(projectId.value)
    } else {
      window.location.reload()
    }
    await waitForever() // to prevent UI changes while reload is happening
  } else {
    await goHome()
  }
}
</script>
