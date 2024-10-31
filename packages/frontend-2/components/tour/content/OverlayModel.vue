<template>
  <div>
    <div v-show="!hasAddedOverlay">
      <p class="text-sm">
        Speckle allows you to load multiple models in the same viewer.
      </p>
      <p class="text-sm mt-2">
        <span v-show="!hasAddedOverlay">
          <FormButton
            link
            text
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

import { SECOND_MODEL_NAME } from '~~/lib/auth/composables/onboarding'

const { items } = useInjectedViewerRequestedResources()
const { project } = useInjectedViewerLoadedResources()
const id = project.value?.id as string

const { result } = useQuery(latestModelsQuery, () => ({ projectId: id }))

const hasAddedOverlay = ref(false)
async function addOverlay() {
  const models = result.value?.project?.models.items
  const otherModel = models?.find((m) => m.name === SECOND_MODEL_NAME)

  if (otherModel)
    await items.update([
      ...items.value,
      ...SpeckleViewer.ViewerRoute.resourceBuilder()
        .addModel(otherModel?.id)
        .toResources()
    ])

  hasAddedOverlay.value = true
}

onBeforeUnmount(() => {
  if (hasAddedOverlay.value) return
  addOverlay()
})
</script>
