<template>
  <div class="w-full h-full bg-foundation flex items-center justify-center">
    <!-- 
    Note: You might be asking yourself why do we need this route: the answer is that cloning 
    a project is not instant, and it might take some time to get it done. We want to display
    some sort of progress to the user in the meantime. Moreover, it makes various composables 
    more sane to use rather than in the router navigation guards.
  -->
    <!-- 
    TODO: Make this page nicer :)  
  -->
    <div class="w-1/5 flex flex-col space-y-2 justify-center text-center">
      <div class="text-xs text-foreground-2">{{ status }}</div>
      <CommonLoadingBar loading />
      <!-- <div class="mx-auto w-20"><LogoTextWhite /></div> -->
    </div>
  </div>
</template>
<script setup lang="ts">
import { useViewerTour } from '~/lib/viewer/composables/tour'
import {
  useProcessOnboarding,
  FIRST_MODEL_NAME
} from '~~/lib/auth/composables/onboarding'
import { homeRoute, modelRoute, projectRoute } from '~~/lib/common/helpers/route'

useHead({
  title: 'Setting up'
})

definePageMeta({
  middleware: ['auth'],
  layout: 'onboarding'
})

const router = useRouter()
const { createOnboardingProject, setUserOnboardingComplete } = useProcessOnboarding()
const tourStage = useViewerTour()

const status = ref('Setting up your account')

onMounted(async () => {
  // Little hacks to make things more exciting
  setTimeout(() => {
    status.value = 'Getting there...'
  }, 2000)
  const { projectId, project } = await createOnboardingProject()

  await setUserOnboardingComplete()
  status.value = 'Almost done!'

  tourStage.showNavbar.value = false
  tourStage.showControls.value = false
  tourStage.showTour.value = true

  const firstModelToLoad = project?.models.items.find(
    (model) => model.name === FIRST_MODEL_NAME
  )

  if (projectId) {
    if (firstModelToLoad) {
      router.push({ path: modelRoute(projectId, firstModelToLoad.id) })
    } else {
      router.push({ path: projectRoute(projectId) })
    }
  } else {
    router.push({ path: homeRoute })
  }
})
</script>
