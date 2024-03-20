<template>
  <LayoutPageTabs v-model:active-item="activePageTab" :items="pageTabItems">
    <NuxtPage :foobar="123" />
  </LayoutPageTabs>
</template>
<script setup lang="ts">
import type { LayoutPageTabItem } from '@speckle/ui-components'

const pageTabItems = computed((): LayoutPageTabItem[] => [
  {
    title: 'Models',
    id: 'models'
    // icon: CubeIcon,
    // count: modelCount.value
  },
  {
    title: 'Discussions',
    id: 'discussions'
    // icon: ChatBubbleLeftRightIcon,
    // count: commentCount.value
  }
  // {
  //   title: 'Automations',
  //   id: 'automations',
  //   icon: BoltIcon,
  //   tag: 'New'
  // }
])

// const activePageTab = computed({
//   get: () => {
//     const path = router.currentRoute.value.path
//     if (path.endsWith('discussions')) return pageTabItems.value[1]
//     if (path.endsWith('automations')) return pageTabItems.value[2]
//     return pageTabItems.value[0]
//   },
//   set: (val: LayoutPageTabItem) => {
//     switch (val.id) {
//       case 'models':
//         router.push({ path: projectRoute(projectId.value, 'models') })
//         break
//       case 'discussions':
//         router.push({ path: projectRoute(projectId.value, 'discussions') })
//         break
//       case 'automations':
//         router.push({ path: projectRoute(projectId.value, 'automations') })
//         break
//     }
//   }
// })
const activePageTab = ref()
</script>
