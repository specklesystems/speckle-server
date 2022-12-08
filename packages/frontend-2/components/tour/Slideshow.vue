<template>
  <div
    class="fixed z-30 left-0 top-0 w-screen h-screen pointer-events-none overflow-hidden"
  >
    <div ref="comments">
      <TourComment
        :index="0"
        :cam-pos="locations[0].camPos"
        :expand="expandedIndex === 0"
        :expanded-index="expandedIndex"
        class="absolute pointer-events-auto"
        @next="(index) => (expandedIndex = index)"
      >
        <!-- <h3 class="h4 font-extrabold">First lesson: models!</h3> -->
        <p class="text-sm">Let's run through a few fast tips!</p>
        <p class="text-sm">
          This is Speckle's 3D viewer, and what you're looking at is a model.
          <br />
          <br />
          Next, we're going to learn how to navigate it!
        </p>
      </TourComment>
      <TourComment
        :index="1"
        :expand="expandedIndex === 1"
        :cam-pos="locations[1].camPos"
        class="absolute pointer-events-auto"
        :expanded-index="expandedIndex"
        @next="(index) => (expandedIndex = index)"
      >
        <p class="text-sm">
          You can easily navigate it by
          <b>rotating</b>
          (left mouse button),
          <b>zooming</b>
          (scroll) and
          <b>panning</b>
          (right mouse button).
          <br />
          <br />
          We'll expose more tools later.
        </p>
      </TourComment>
      <TourComment
        :index="2"
        :expand="expandedIndex === 2"
        :cam-pos="locations[2].camPos"
        class="absolute pointer-events-auto"
        :expanded-index="expandedIndex"
        @next="(index) => (expandedIndex = index)"
      >
        <p class="text-sm">
          Speckle allows you to load multiple models in the same viewer. Give it a try!
        </p>
        <FormButton
          size="sm"
          outlined
          full-width
          :icon-right="hasAddedOverlay ? CheckIcon : null"
          :disabled="hasAddedOverlay"
          @click="addOverlay()"
        >
          Overlay Another Model
        </FormButton>
        <br />
        <p class="text-sm">
          Every model is also versioned - every time you send data to Speckle, we store
          it as a new version. Try loading a previous version of the model we just
          overlaid!
        </p>
        <FormButton
          size="sm"
          outlined
          full-width
          :disabled="!hasAddedOverlay || hasSwappedVersions"
          :icon-right="hasSwappedVersions ? CheckIcon : null"
          @click="changeOverlayVersion()"
        >
          Load a Different Version
        </FormButton>
        <p class="text-xs dark:text-foundation-5">
          PS: Don't worry about space requirements, we keep track of changes only :)
          Speckle can easily do this because it's
          <b>object based</b>
          (not
          <i>file</i>
          based):
          <b>we decompose 3D models into their atoms.</b>
        </p>
        <!-- <FormButton size="xs" outlined>Isolate objects</FormButton> -->
      </TourComment>
      <TourComment
        :index="3"
        :expand="expandedIndex === 3"
        :cam-pos="locations[3].camPos"
        class="absolute pointer-events-auto"
        :expanded-index="expandedIndex"
        @next="(index) => (expandedIndex = index)"
      >
        <p class="text-sm">
          You've got the basics around models and versions. Let's see how they all come
          together under a
          <b>Project</b>
          !
        </p>
        <template #actions>
          <FormButton text outlined size="sm">Skip</FormButton>
          <div class="w-full text-right">
            <FormButton :icon-right="ArrowRightIcon" size="sm">Let's go!</FormButton>
          </div>
        </template>
      </TourComment>
    </div>
  </div>
</template>
<script setup lang="ts">
import { locations } from '~~/lib/tour/mockedComments'
import { Vector3 } from 'three'
import { Viewer } from '@speckle/viewer'
import {
  XMarkIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/vue/24/solid'

const comments = ref<HTMLElement | null>(null)
const expandedIndex = ref(0)
provide('index', expandedIndex)
const viewer = inject('viewer') as Viewer

onMounted(() => {
  viewer.cameraHandler.controls.addEventListener('update', () => {
    const cam = viewer.cameraHandler.camera
    cam.updateProjectionMatrix()

    let index = 0
    for (const child of (comments.value as HTMLElement).children) {
      const data = locations[index]
      const location = new Vector3(data.location.x, data.location.y, data.location.z)
      location.project(cam)
      const commentLocation = new Vector3(
        (location.x * 0.5 + 0.5) * window.innerWidth - 20,
        (location.y * -0.5 + 0.5) * window.innerHeight - 20,
        0
      )
      const commentEl = child as HTMLElement
      commentEl.style.left = `${commentLocation.x}px`
      commentEl.style.top = `${commentLocation.y}px`
      index++
    }
  })
})

const hasAddedOverlay = ref(false)
const hasSwappedVersions = ref(false)

function addOverlay() {
  // TODO
  hasAddedOverlay.value = true
}

function changeOverlayVersion() {
  // TODO
  hasSwappedVersions.value = true
}
</script>
