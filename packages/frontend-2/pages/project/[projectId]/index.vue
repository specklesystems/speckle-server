<template>
  <main class="default-width">
    <div class="">
      <div class="flex justify-end gap-4">
        <div class="grow">
          <div
            class="h-full w-max flex gap-4 items-center background overflow-hidden rounded-lg px-4 py-5 shadow sm:p-6"
          >
            <div>
              <dt class="truncate text-sm font-medium text-gray-500">Team</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight">4</dd>
            </div>
            <AvatarGroup :num-avatars="1" />
            <button
              class="rounded-lg scale-100 hover:scale-[1.04] bg-blue-100 hover:bg-blue-200 dark:bg-slate-800 hover:dark:bg-slate-900 text-blue-500 xxxdark:text-gray-500 text-sm shadow hover:shadow-md px-4 py-2 cursor-pointer transition"
            >
              +
            </button>
          </div>
        </div>
        <div
          v-for="item in stats"
          :key="item.name"
          class="w-36 background overflow-hidden rounded-lg px-4 py-5 shadow sm:p-6"
        >
          <dt class="truncate text-sm font-medium text-gray-500">{{ item.name }}</dt>
          <dd class="mt-1 text-3xl font-semibold tracking-tight">
            {{ item.value }}
          </dd>
        </div>
      </div>
    </div>
    <br />
    <NuxtLink :to="`/project/${$route.params.projectId}/webhooks`">
      TO WEBHOOKS
    </NuxtLink>
    <br />
    <NuxtLink :to="`/project/${$route.params.projectId}/model/fakeId`">
      TO Model Page
    </NuxtLink>
  </main>
</template>
<script setup lang="ts">
const route = useRoute()
const stats = [
  {
    name: 'Versions',
    value: 201
  },
  {
    name: 'Models',
    value: 200
  },
  {
    name: 'Comments',
    value: 12
  }
]
</script>
