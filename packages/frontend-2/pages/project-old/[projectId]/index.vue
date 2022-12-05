<template>
  <div class="">
    <div class="flex justify-end gap-2">
      <div class="grow">
        <div
          class="group h-full w-max flex gap-4 items-center bg-foundation hover:bg-foundation-focus cursor-pointer overflow-hidden rounded-lg px-4 py-5 shadow-lg hover:shadow-xl transition sm:p-6"
        >
          <div>
            <dt
              class="truncate text-sm font-medium text-foreground-2 group-hover:text-primary"
            >
              Team
            </dt>
            <dd
              class="mt-1 text-3xl font-semibold tracking-tight text-foreground group-hover:text-primary"
            >
              4
            </dd>
          </div>
          <AvatarGroup :num-avatars="3" />
        </div>
      </div>
      <div
        v-for="item in stats"
        :key="item.name"
        class="w-36 bg-foundation overflow-hidden rounded-lg px-4 py-5 sm:p-6"
      >
        <dt class="truncate text-sm font-medium text-foreground-2">
          {{ item.name }}
        </dt>
        <dd class="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          {{ item.value }}
        </dd>
      </div>
    </div>
    <ModelDashboardList title="Models" :num-models="6" />
    <br />
    <p class="text-foreground">
      <NuxtLink :to="`/project/${$route.params.projectId}/webhooks`">
        TO WEBHOOKS
      </NuxtLink>
      <br />
      <NuxtLink :to="`/project/${$route.params.projectId}/model/fakeId`">
        TO Model Page
      </NuxtLink>
    </p>
  </div>
</template>
<script setup lang="ts">
const stats = [
  {
    name: 'Versions',
    value: 2
  },
  {
    name: 'Models',
    value: 200
  },
  {
    name: 'Comments',
    value: 12
  },
  {
    name: 'Settings',
    value: '⚙️'
  }
]
</script>
