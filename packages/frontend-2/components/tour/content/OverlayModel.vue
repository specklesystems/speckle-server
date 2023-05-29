<template>
  <div>
    <div v-show="!hasAddedOverlay">
      <p class="text-sm">
        Speckle allows you to load multiple models in the same viewer.
        <span v-show="!hasAddedOverlay">
          <FormButton
            size="sm"
            link
            :icon-right="hasAddedOverlay ? CheckIcon : null"
            :disabled="hasAddedOverlay"
            @click="addOverlay()"
          >
            Click here
          </FormButton>
          to give it a try!
        </span>
      </p>
    </div>
    <div v-show="hasAddedOverlay">
      <p class="text-sm">
        Nice - you've just created a "federated" model. Ready for what's next?
        <!-- <br />
        <br />
        Let's go to the next step. -->
      </p>
      <!-- <p class="text-sm">You can overlay as many models as you want.</p> -->
    </div>
  </div>
</template>
<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/24/solid'
import { SpeckleViewer } from '@speckle/shared'
import { useQuery } from '@vue/apollo-composable'
import { latestModelsQuery } from '~~/lib/projects/graphql/queries'
import {
  useInjectedViewerRequestedResources,
  useInjectedViewerLoadedResources
} from '~~/lib/viewer/composables/setup'

const { items } = useInjectedViewerRequestedResources()
const { project, modelsAndVersionIds } = useInjectedViewerLoadedResources()
const id = project.value?.id as string

const { result: models } = useQuery(latestModelsQuery, () => ({ projectId: id }))

const hasAddedOverlay = ref(false)
async function addOverlay() {
  const allmodels = models.value?.project?.models.items
  const currentModelId = modelsAndVersionIds.value[0].model.id
  const otherModelId = allmodels?.find((m) => m.id !== currentModelId)?.id as string
  await items.update([
    ...items.value,
    ...SpeckleViewer.ViewerRoute.resourceBuilder().addModel(otherModelId).toResources()
  ])

  hasAddedOverlay.value = true
}

onBeforeUnmount(() => {
  if (hasAddedOverlay.value) return
  addOverlay()
})
</script>
