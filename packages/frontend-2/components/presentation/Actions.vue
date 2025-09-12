<template>
  <div
    class="bg-foundation border border-outline-3 rounded-xl shadow-md h-10 flex items-center"
  >
    <div class="flex items-center justify-between space-x-1 p-1">
      <FormButton
        v-if="!isPresentMode"
        :icon-left="LucidePlay"
        @click="emit('togglePresentMode')"
      >
        Present
      </FormButton>

      <LayoutMenu
        v-model:open="showMenu"
        :items="menuItems"
        :menu-id="menuId"
        mount-menu-on-body
        @chosen="onActionChosen"
      >
        <PresentationFloatingPanelButton @click="showMenu = !showMenu">
          <LucideEllipsis class="size-4" />
        </PresentationFloatingPanelButton>
      </LayoutMenu>

      <PresentationFloatingPanelButton v-if="isPresentMode" @click="toggleFullscreen">
        <LucideFullscreen class="size-4" />
      </PresentationFloatingPanelButton>

      <PresentationFloatingPanelButton
        :is-active="isSidebarOpen"
        @click="emit('toggleSidebar')"
      >
        <LucideInfo class="size-4" />
      </PresentationFloatingPanelButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  LucideInfo,
  LucideFullscreen,
  LucidePlay,
  LucideEllipsis
} from 'lucide-vue-next'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { presentationRoute } from '~/lib/common/helpers/route'

const { copy } = useClipboard()
const { triggerNotification } = useGlobalToast()

const props = defineProps<{
  presentationId: string
}>()

enum MenuItems {
  CopyLink = 'copy-link',
  CopyPublicLink = 'copy-public-link'
}

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
  (e: 'togglePresentMode'): void
}>()

const isSidebarOpen = defineModel<boolean>('is-sidebar-open')
const isPresentMode = defineModel<boolean>('is-present-mode')

const showMenu = ref(false)
const menuId = useId()

const menuItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: 'Copy link',
      id: MenuItems.CopyLink
    }
  ],
  [
    {
      title: 'Copy public link',
      id: MenuItems.CopyPublicLink
    }
  ]
])

const onActionChosen = async (params: { item: LayoutMenuItem }) => {
  const { item } = params

  switch (item.id) {
    case MenuItems.CopyLink:
      onCopyLink()
      break
    case MenuItems.CopyPublicLink:
      onCopyPublicLink()
      break
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const onCopyLink = async () => {
  if (import.meta.server) return
  const url = presentationRoute(props.presentationId)
  if (!url) return

  try {
    await copy(new URL(url, window.location.origin).toString())
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Link copy failed'
    })
    throw e
  }

  triggerNotification({
    type: ToastNotificationType.Info,
    title: 'Copied link'
  })
}

const onCopyPublicLink = async () => {
  if (import.meta.server) return
  const url = presentationRoute(props.presentationId)
  if (!url) return

  try {
    await copy(new URL(url, window.location.origin).toString())
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Public link copy failed'
    })
    throw e
  }

  triggerNotification({
    type: ToastNotificationType.Info,
    title: 'Copied public link'
  })
}
</script>
