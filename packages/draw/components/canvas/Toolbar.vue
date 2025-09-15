<template>
  <div class="z-20 w-full h-full top-0">
    <div
      v-if="viewerStore.loadedViewerId === props.id"
      class="absolute top-2 left-1/2 -translate-x-1/2"
    >
      <FormButton color="outline" size="sm" @click="viewerMode = !viewerMode">
        {{ viewerMode ? 'Switch to draw mode' : 'Switch to viewer mode' }}
      </FormButton>
    </div>

    <!-- TODO: Implement viewer related features here -->
    <!-- <div
      v-if="viewerStore.loadedViewerId === props.id"
      class="absolute left-2 top-1/2 -translate-y-1/2"
    >
      <div class="flex flex-row space-x-0.5">
        <FormButton
          v-tippy="'Toogle section'"
          :color="'outline'"
          :icon-left="ScissorsIcon"
          hide-text
          @click.stop.prevent="toggleSection"
        >
          Toggle section
        </FormButton>
      </div>
    </div> -->

    <!-- TODO: this should go into another component -->
    <!-- <div
      v-if="snapshots?.length > 1"
      class="absolute flex flex-col right-1 top-1/2 -translate-y-1/2 space-y-0.5"
    >
      <button
        v-for="snapshot in snapshots"
        :key="snapshot.id"
        class="group px-2 py-1 rounded-md text-foreground-3 hover:bg-foundation-1 hover:text-primary-focus transition-colors duration-200"
        :class="{
          'bg-foundation-1 text-primary-focus scale-105':
            snapshot.id === activeSnapshotId,
          'text-foreground-3 hover:bg-foundation-1 hover:text-primary-focus hover:scale-105':
            snapshot.id !== activeSnapshotId
        }"
        @click="activateSnapshot(snapshot.id)"
      >
        <div class="flex flex-row items-center justify-end space-x-2 text-xs">
          <div>{{ snapshot.name }}</div>

          <div class="w-4 h-[1px] bg-foreground-3 group-hover:hidden" />

          <div class="hidden group-hover:flex items-center justify-center">
            <span
              class="w-4 h-4 rounded-sm hover:bg-foundation-2"
              role="button"
              aria-label="Remove snapshot"
              title="Remove snapshot"
              @click.stop="removeSnapshot(snapshot.id)"
            >
              ×
            </span>
          </div>
        </div>
      </button>
    </div> -->

    <!-- Viewer related actions -->
    <div
      class="fixed bg-foundation p-1 rounded-lg bottom-6 left-1/2 -translate-x-1/2 space-x-0.5 border border-foundation-1"
    >
      <div class="flex flex-row space-x-2">
        <template v-if="paper?.mode === 'infinite'">
          <div class="flex flex-row space-x-0.5">
            <div class="relative inline-block">
              <FormButton
                v-tippy="'Load model from Speckle'"
                :color="store.currentTool === 'viewer' ? 'primary' : 'outline'"
                :icon-left="ArrowDownTrayIcon"
                hide-text
                @click="store.setTool('viewer')"
              >
                Add 3D viewer model
              </FormButton>
            </div>

            <!-- <div class="relative inline-block">
            <FormButton
              v-tippy="'Take a snapshot'"
              color="outline"
              :icon-left="Save"
              hide-text
              @click="toggleSaveSnapshotPopup"
            >
              Take a screenshot
            </FormButton>
            <div
              v-if="saveSnapshotPopupIsActive"
              class="absolute flex flex-row space-x-1 bottom-12 left-1/2 -translate-x-1/2 bg-white rounded shadow-md p-2 z-50 w-96"
            >
              <input
                v-model="snapshotNameToSave"
                placeholder="Snapshot name"
                type="text"
                class="border rounded px-2 py-1 z-50 w-full"
              />
              <FormButton color="outline" class="z-50" @click.stop="saveSnapshot">
                Save
              </FormButton>
            </div>
          </div> -->
            <!-- <FormButton
            v-tippy="'Take a screenshot'"
            color="outline"
            :icon-left="CameraIcon"
            hide-text
            @click="$emit('screenshotClicked')"
          >
            Take a screenshot
          </FormButton> -->
          </div>
          <div class="w-[1px] bg-slate-200" />
        </template>

        <!-- Sytling actions -->
        <div class="flex flex-row space-x-0.5">
          <!-- Color picker -->
          <FormButton
            v-tippy="'Pick color'"
            color="subtle"
            class="!p-1 rounded-full flex items-center justify-center relative overflow-hidden"
            @click="openColorPicker"
          >
            <div
              class="w-6 h-6 rounded-full border cursor-pointer"
              :style="{ backgroundColor: store.currentStrokeColor }"
            />
            <!-- TODO: we can use library for that later -->
            <input
              ref="colorInput"
              v-model="store.currentStrokeColor"
              type="color"
              class="absolute -top-4 left-0 w-full h-full opacity-0 cursor-pointer"
              @input="updateSelectedColors($event.target.value, null)"
            />
          </FormButton>

          <!-- Thickness -->
          <div class="space-x-0.5">
            <div class="relative inline-block">
              <FormButton
                v-tippy="'Thickness'"
                color="subtle"
                class="!p-1 rounded-full flex items-center justify-center overflow-hidden w-8 h-8"
                @click="toggleThicknessPopover"
              >
                <div
                  class="w-6 h-6 rounded-full border flex items-center justify-center"
                >
                  <div
                    class="absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    :style="{
                      width: store.brushSize + 'px',
                      height: store.brushSize + 'px',
                      backgroundColor: store.currentStrokeColor
                    }"
                  />
                </div>
              </FormButton>

              <div
                v-if="showThickness"
                class="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white rounded shadow-md p-2 z-50"
              >
                <input
                  v-model.number="store.brushSize"
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                />
              </div>
            </div>
          </div>
          <!-- Line types -->
          <div class="space-x-0.5">
            <div class="relative inline-block">
              <Menu as="div">
                <MenuButton
                  as="div"
                  class="grid place-items-center rounded-md bg-foundation-1/70 hover:bg-foundation-3 cursor-pointer"
                  title="More actions"
                  @click.stop
                >
                  <FormButton
                    v-tippy="'Line type'"
                    color="subtle"
                    class="thickness-button p-0 !px-1 rounded-full flex items-center justify-center overflow-hidden w-8 h-8"
                    @click="toggleLineTypePopover"
                  >
                    <div class="w-6 h-6 relative flex items-center justify-center">
                      <div
                        class="absolute rounded-full bg-gray-600 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        :style="{
                          width: '20px',
                          height: store.brushSize + 'px',
                          backgroundColor: store.currentStrokeColor
                        }"
                      />
                    </div>
                  </FormButton>
                </MenuButton>

                <Transition
                  enter-active-class="transition ease-out duration-150"
                  enter-from-class="transform opacity-0 scale-95"
                  enter-to-class="transform opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-100"
                  leave-from-class="transform opacity-100 scale-100"
                  leave-to-class="transform opacity-0 scale-95"
                >
                  <MenuItems
                    class="absolute space-y-1 text-xs bottom-10 z-50 min-w-36 bg-foundation outline outline-1 outline-primary-muted rounded-md shadow-lg py-1"
                    @click.stop
                  >
                    <MenuItem v-slot="{ active }">
                      <button
                        class="w-full text-left px-3 rounded transition"
                        :class="active ? 'bg-highlight-1' : ''"
                        @click.stop="selectedLineType = 'straight'"
                      >
                        Straight
                      </button>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <button
                        class="w-full text-left px-3 rounded transition"
                        :class="active ? 'bg-highlight-1' : ''"
                        @click.stop="selectedLineType = 'dashed'"
                      >
                        Dashed
                      </button>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <button
                        class="w-full text-left px-3 rounded transition"
                        :class="active ? 'bg-highlight-1' : ''"
                        @click.stop="selectedLineType = 'dashedAndDotted'"
                      >
                        Dashed and dotted
                      </button>
                    </MenuItem>
                  </MenuItems>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
        <div class="w-1 bg-foundation-2" />

        <!-- Shape actions -->
        <div class="flex flex-row space-x-0.5">
          <!-- decided to not have them with V0 -->
          <!-- <FormButton
            v-tippy="'Draw rectangle'"
            :color="store.currentTool === 'rect' ? 'primary' : 'outline'"
            :icon-left="Square"
            hide-text
            @click="store.setTool('rect')"
          >
            Rectangle
          </FormButton>
          <FormButton
            v-tippy="'Draw circle'"
            :color="store.currentTool === 'circle' ? 'primary' : 'outline'"
            :icon-left="Circle"
            hide-text
            @click="store.setTool('circle')"
          >
            Circle
          </FormButton> -->
          <ViewerControlButtonToggle
            :active="store.currentTool === 'text'"
            :icon="Type"
            @click="store.setTool('text')"
          />
          <ViewerControlButtonToggle
            :active="store.currentTool === 'arrow'"
            :icon="ArrowUpFromDot"
            @click="store.setTool('arrow')"
          />
          <ViewerControlButtonToggle
            :active="store.currentTool === 'polyline'"
            @click="store.setTool('polyline')"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
              :fill="'black'"
            >
              <path :d="mdiVectorPolyline" />
            </svg>
          </ViewerControlButtonToggle>
          <ViewerControlButtonToggle
            :active="store.currentTool === 'freehand'"
            :icon="LineSquiggle"
            @click="store.setTool('freehand')"
          />

          <!-- TODO: eraser need more thinking, i do not wanna draw white lines to pretend it is deleted -->
          <!-- <FormButton
        :color="store.currentTool === 'eraser' ? 'primary' : 'outline'"
        :icon-left="Eraser"
        hide-text
        @click="store.setTool('eraser')"
      >
        Eraser
      </FormButton> -->
          <ViewerControlButtonToggle
            :active="store.currentTool === 'select'"
            :icon="CursorArrowRaysIcon"
            @click="store.setTool('select')"
          />
          <ViewerControlButtonToggle
            :icon="TrashIcon"
            @click="store.clearShapes(props.id, 'broccoli')"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Load model popup - moved outside to avoid z-index issues -->
  <div
    v-if="loadModelPopupIsActive"
    class="fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-20"
    @click="loadModelPopupIsActive = false"
  >
    <div
      class="flex flex-row space-x-1 bg-white rounded shadow-md p-4 w-96 max-w-[90vw]"
      @click.stop
    >
      <input
        v-model="modelUrl"
        placeholder="Model URL"
        type="text"
        class="border rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        @keyup.enter="loadModel"
      />
      <FormButton color="outline" @click.stop="loadModel">Load</FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CursorArrowRaysIcon,
  TrashIcon,
  CameraIcon,
  ScissorsIcon
} from '@heroicons/vue/24/outline'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import {
  Square,
  Circle,
  Save,
  LineSquiggle,
  ArrowUpFromDot,
  Type
} from 'lucide-vue-next'
import { useCanvasStore } from '../../stores/canvas'
import { ArrowDownTrayIcon } from '@heroicons/vue/20/solid'
import { SectionTool } from '@speckle/viewer'
import { mdiVectorPolyline, mdiVectorLine } from '@mdi/js'
// import { useColorMode } from '@vueuse/core'
import { useViewerStore } from '../../stores/sharedViewer'
import ViewerControlButtonToggle from '../viewer/control/ButtonToggle.vue'
import { storeToRefs } from 'pinia'

const store = useCanvasStore()
// const color = useColorMode()
const viewerStore = useViewerStore()
const { viewerMode } = storeToRefs(store)

const props = defineProps<{
  id: string
}>()

defineEmits<{
  (e: 'screenshotClicked'): void
}>()

const paper = computed(() => store.getActivePaper())

const colorInput = ref<HTMLInputElement | null>(null)
const loadModelPopupIsActive = ref(false)
const saveSnapshotPopupIsActive = ref(false)
const modelUrl = ref<string>()
const snapshotNameToSave = ref<string>()

// const snapshots = computed(() => {
//   const paper = store.papers.find((p) => p.id === props.id)
//   if (!paper) return undefined
//   return [paper.liveSnapshot, ...paper.snapshots]
// })

// const activeSnapshotId = computed(() => {
//   const paper = store.papers.find((p) => p.id === props.id)
//   if (!paper) return undefined
//   return paper.activeSnapshotId
// })

const { showThickness, showLineType, selectedLineType } = storeToRefs(store)

const openColorPicker = () => {
  colorInput.value?.click()
}

// const mdiFillColor = (toolToCheck: Tools) => {
//   return store.currentTool === toolToCheck || color.preference === 'dark'
//     ? 'white'
//     : 'black'
// }

const toggleSection = () => {
  console.log('Toggle section')
  const viewer = viewerStore.getViewer(props.id)
  if (!viewer) return

  const box = viewer.getRenderer().sceneBox
  console.log(box)
  const sectionTool = viewer.getExtension(SectionTool)
  console.log(sectionTool)
  sectionTool.setBox(box)
  console.log(box)

  viewer.getExtension(SectionTool).toggle()
  console.log(box)
}

const toggleThicknessPopover = () => {
  showThickness.value = !showThickness.value
}

const toggleLineTypePopover = () => {
  showLineType.value = !showLineType.value
}

const toggleLoadModelPopup = () => {
  saveSnapshotPopupIsActive.value = false
  loadModelPopupIsActive.value = !loadModelPopupIsActive.value
}

const toggleSaveSnapshotPopup = () => {
  loadModelPopupIsActive.value = false
  saveSnapshotPopupIsActive.value = !saveSnapshotPopupIsActive.value
}

const updateSelectedColors = (stroke?: string, fill?: string) => {
  store.selectedIds.forEach((id) => {
    store.updateShape(id, {
      ...(stroke && { strokeColor: stroke }),
      ...(fill && { fillColor: fill })
    })
  })
}

const loadModel = async () => {
  if (!modelUrl.value) return
  await viewerStore.loadModelByUrl(props.id, modelUrl.value)
  loadModelPopupIsActive.value = false
  store.setModelUrl(props.id, modelUrl.value)
}

const saveSnapshot = async () => {
  await store.saveSnapshot(props.id, snapshotNameToSave.value || 'Untitled')
  toggleSaveSnapshotPopup()
  snapshotNameToSave.value = ''
}

const activateSnapshot = (snapshotId: string) => {
  store.setActiveSnapshot(props.id, snapshotId)
  viewerStore.setCameraForPaper(props.id)
  viewerMode.value = false
}

const removeSnapshot = async (snapshotId: string) => {
  await store.removeSnapshot(props.id, snapshotId)
}
</script>
