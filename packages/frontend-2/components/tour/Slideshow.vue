<template>
  <div
    class="fixed z-30 left-0 top-0 w-screen h-screen pointer-events-none overflow-hidden"
  >
    <div ref="comments">
      <TourComment :index="0" class="absolute pointer-events-auto">
        <p class="rounded bg-primary text-foreground-on-primary p-2 text-sm">
          Note: the next few steps are placeholders. Any ideas welcome, bearing in mind
          we can't do everything in here yet.
        </p>
        <p class="text-sm">Let's run through a few fast tips!</p>
        <p class="text-sm">
          This is Speckle's 3D viewer, and what you're looking at is a model.
          <br />
          <br />
          Next, we're going to learn how to navigate it!
        </p>
      </TourComment>
      <TourComment :index="1" class="absolute pointer-events-auto">
        <p class="text-sm">
          You can easily navigate it by
          <b>rotating</b>
          (left mouse button),
          <b>zooming</b>
          (scroll) and
          <b>panning</b>
          (right mouse button).
        </p>
      </TourComment>
      <TourComment :index="2" class="absolute pointer-events-auto">
        <p class="text-sm">
          Speckle allows you to load multiple models in the same viewer. Give it a try!
          <br />
          TODO: remove zoom extents on load
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
        :expand="commentState === 3"
        :cam-pos="locations[3].camPos"
        class="absolute pointer-events-auto"
        :expanded-index="commentState"
        @next="(index) => (commentState = index)"
      >
        <p class="text-sm">
          You've got the basics around models and versions. Let's see how they all come
          together under a
          <b>Project</b>
          !
        </p>
      </TourComment>
    </div>
  </div>
  <Transition
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
    enter-active-class="transition duration-300"
    leave-active-class="transition duration-300"
  >
    <div
      v-show="commentState < 0"
      class="fixed bottom-0 left-0 w-full h-28 flex align-center p-10 justify-center space-x-2 pointer-events-auto"
    >
      <FormButton size="xs" color="invert" rounded to="/">Skip</FormButton>
      <FormButton size="sm" :icon-right="ArrowRightIcon" rounded>
        Explore Sample Project
      </FormButton>
    </div>
  </Transition>
</template>
<script setup lang="ts">
import { locations } from '~~/lib/tour/mockedComments'
import { Vector3 } from 'three'
import { Viewer } from '@speckle/viewer'
import { ArrowRightIcon, CheckIcon } from '@heroicons/vue/24/solid'

const comments = ref<HTMLElement | null>(null)
const commentState = ref(0)

provide('commentState', commentState)
provide('locations', locations)

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

async function addOverlay() {
  // TODO
  await viewer.loadObject(
    'https://latest.speckle.dev/streams/b5cc4e967c/objects/6ae2f9fca55c7b3e135401947f9b2259'
    // 'https://latest.speckle.dev/streams/b5cc4e967c/objects/7ab1ff0f6b3ae24015216c89c5612e4e'
    // 'https://latest.speckle.dev/streams/b5cc4e967c/objects/9a210ff9cf2252efd22f0f722bf07d57'
  )
  hasAddedOverlay.value = true
}
</script>
