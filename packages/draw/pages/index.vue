<template>
  <div ref="broccoli" class="relative min-h-screen flex flex-col">
    <HeaderNavBar />
    <div class="p-3 space-y-3">
      <div class="space-x-3">
        <FormButton
          class="flex flex-col"
          size="sm"
          color="outline"
          @click="createNewPaper('infinite')"
        >
          Create Infinite Paper
        </FormButton>
        <FormButton
          class="flex flex-col"
          size="sm"
          color="outline"
          @click="createNewPaper('adaptive')"
        >
          Create Adaptive Paper
        </FormButton>
      </div>

      <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="paper in papers"
          :key="paper.id"
          role="button"
          tabindex="0"
          class="group rounded-xl border bg-foundation hover:bg-foundation-2 transition shadow-sm"
          @click="openPaper(paper.id)"
        >
          <div class="aspect-[16/7] relative">
            <!-- <div
              v-if="paper.viewerContainers.length > 0"
              class="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 text-xs"
            >
              <CameraIcon class="w-3.5 h-3.5" />
              <span>{{ paper.viewerContainers.length }}</span>
            </div> -->
            <img
              v-if="liveThumb(paper)"
              :src="liveThumb(paper)"
              alt=""
              class="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div
              v-else
              class="absolute inset-0 flex items-center justify-center text-3xl"
            >
              🥦
            </div>
          </div>

          <hr />
          <div class="p-2 relative text-center" @click.stop>
            <div class="group/title relative">
              <!-- editing state -->
              <input
                v-if="editingId === paper.id"
                ref="titleInput"
                v-model="draftName"
                type="text"
                autofocus
                class="w-full bg-transparent border border-outline-2 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary border-md hover:border"
                @keydown.enter.prevent="commitEdit(paper.id)"
                @keydown.esc.prevent="cancelEdit"
                @blur="commitEdit(paper.id)"
              />
              <!-- display state -->
              <h3
                v-else
                class="font-medium truncate cursor-text"
                @click="startEdit(paper)"
              >
                {{ paper.name }}
              </h3>

              <!-- pencil on hover (display state only) -->
              <button
                v-if="editingId !== paper.id"
                class="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/title:opacity-100 transition text-foreground-3 hover:text-foreground"
                title="Rename"
                @click.stop="startEdit(paper)"
              >
                ✏️
              </button>
            </div>
            <p class="mt-0.5 text-xs">
              {{ updatedAt(paper) }}
            </p>

            <!-- Bottom-right menu -->
            <Menu as="div" class="absolute bottom-2 right-2">
              <MenuButton
                as="div"
                class="p-1 grid place-items-center rounded-md bg-foundation-1/70 hover:bg-foundation-3 cursor-pointer"
                title="More actions"
                @click.stop
              >
                <EllipsisVerticalIcon class="w-4 h-4" />
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
                  class="absolute right-0 bottom-10 z-50 min-w-36 bg-foundation outline outline-1 outline-primary-muted rounded-md shadow-lg py-1"
                  @click.stop
                >
                  <MenuItem v-slot="{ active }">
                    <button
                      class="w-full text-left px-3 py-1.5 text-sm mx-1.5 rounded transition"
                      :class="active ? 'bg-highlight-1' : ''"
                      @click.stop="canvasStore.duplicatePaper(paper.id)"
                    >
                      Duplicate
                    </button>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <button
                      class="w-full text-left px-3 py-1.5 text-sm mx-1.5 rounded text-red-600 transition"
                      :class="active ? 'bg-highlight-1' : ''"
                      @click.stop="canvasStore.deletePaper(paper.id)"
                    >
                      Delete
                    </button>
                  </MenuItem>
                </MenuItems>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import type { ViewerContainer, PaperMode } from '~/lib/paper'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { EllipsisVerticalIcon, CameraIcon } from 'lucide-vue-next'
import { getUniqueId } from '../utils/index'

const router = useRouter()
const accountStore = useAccountStore()
const canvasStore = useCanvasStore()

// IMPORTANT: the account init client needs to be awaited here, and in any other top level page to prevent
await accountStore.initClient()

if (!accountStore.account) {
  router.replace('/authn/login')
}

const broccoli = ref<HTMLElement | null>(null)
const windowSize = reactive({ w: 0, h: 0 })

const papers = computed(() =>
  [...canvasStore.papers].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
)

const liveThumb = (paper: ViewerContainer) => paper.liveSnapshot?.thumbUrl || null

const updatedAt = (paper: ViewerContainer) => dayjs(paper.updatedAt).from(dayjs())

const openPaper = (id: string) => {
  const { activePaperId } = storeToRefs(canvasStore)

  activePaperId.value = id
  console.log('Opening paper:', id)
  router.push(`/paper/${id}`)
}

const createNewPaper = async (mode: PaperMode) => {
  const id = getUniqueId()
  await canvasStore.createPaper(id, mode, windowSize.w, windowSize.h)
  router.push(`/paper/${id}`)
}

const editingId = ref<string | null>(null)
const draftName = ref('')
const titleInput = ref<HTMLInputElement | null>(null)

const startEdit = (card: { id: string; name: string }) => {
  editingId.value = card.id
  draftName.value = card.name
  nextTick(() => {
    titleInput.value?.focus()
    titleInput.value?.select()
  })
}

const commitEdit = async (id: string) => {
  if (editingId.value !== id) return
  const name = draftName.value.trim()
  editingId.value = null
  if (!name) return
  // use your store’s rename if present; fallback to local mutate
  await canvasStore.renamePaper(id, name)
}

const cancelEdit = () => {
  editingId.value = null
}

onMounted(() => {
  // TODO: once we move annotations into main app, we need to store current window size somewhere to initialize the paper
  if (!broccoli.value) return
  const el = broccoli.value
  const upd = () => {
    windowSize.w = el.clientWidth
    windowSize.h = el.clientHeight
  }
  upd()
  useResizeObserver(el, upd)
})
</script>
