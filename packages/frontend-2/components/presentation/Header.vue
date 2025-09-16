<template>
  <PresentationFloatingPanel>
    <div class="flex items-center justify-between space-x-1">
      <PresentationFloatingPanelButton
        :active="isSidebarOpen"
        @click="emit('toggleSidebar')"
      >
        <LucideArrowLeftToLine v-if="isSidebarOpen" class="size-4" />
        <LucidePanelLeft v-else class="size-4" />
      </PresentationFloatingPanelButton>
      <h1
        v-if="title"
        class="text-body-xs font-medium text-foreground leading-none md:pr-1.5"
        :class="{ 'hidden md:block': isSidebarOpen }"
      >
        {{ title }}
      </h1>

      <LayoutMenu
        v-model:open="showMenu"
        class="hidden md:block"
        :items="menuItems"
        :menu-id="menuId"
        mount-menu-on-body
        @chosen="onActionChosen"
      >
        <PresentationFloatingPanelButton @click="showMenu = !showMenu">
          <LucideEllipsis class="size-4" />
        </PresentationFloatingPanelButton>
      </LayoutMenu>
    </div>
  </PresentationFloatingPanel>
</template>

<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { LucideArrowLeftToLine, LucidePanelLeft, LucideEllipsis } from 'lucide-vue-next'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'

enum MenuItems {
  OpenInViewer = 'open-in-viewer'
}

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
}>()

defineProps<{
  title: MaybeNullOrUndefined<string>
}>()

const isSidebarOpen = defineModel<boolean>('is-sidebar-open')

const menuId = useId()

const showMenu = ref(false)

const menuItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: 'Copy link',
      id: MenuItems.OpenInViewer
    }
  ]
])

const onActionChosen = (params: { item: LayoutMenuItem }) => {
  const { item } = params

  switch (item.id) {
    case MenuItems.OpenInViewer:
    // do something
  }
}
</script>
