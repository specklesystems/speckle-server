<template>
  <div class="flex items-center">
    <div class="flex -space-x-2">
      <!-- <img
        v-for="(user, i) in avatars.slice(0, numAvatars)"
        :key="i + 'avatar'"
        class="inline-block h-8 w-8 rounded-full ring-4 ring-white dark:ring-black"
        :src="user.avatar"
        alt=""
      /> -->

      <template v-for="(user, i) in avatars.slice(0, numAvatars)" :key="i + 'avatar'">
        <img
          v-if="i % 2 == 0"
          :alt="user.name"
          :src="user.avatar"
          class="inline-block h-8 w-8 rounded-full shadow-md"
        />
        <div
          v-else
          class="h-8 w-8 bg-primary rounded-full shadow-md flex items-center justify-center text-sm font-bold tracking-tighter text-white"
        >
          {{ user.name.split(' ')[0][0] }}{{ user.name.split(' ')[1][0] }}
        </div>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps({
  numAvatars: {
    type: Number,
    default: 5
  }
})

const avatars = [
  {
    name: 'Steve Ballmer',
    avatar:
      'https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    name: 'Bob Cadify',
    avatar:
      'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    name: 'Brep Master',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80'
  },
  {
    name: 'Spartacus Author',
    avatar:
      'https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    name: 'Jane Austen',
    avatar:
      'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    name: 'Bruno Latour',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80'
  },
  {
    name: 'Margaret Sussman',
    avatar:
      'https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    name: 'Donella Abelson',
    avatar:
      'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    name: 'Foo Bar',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80'
  },
  {
    name: 'Baz Qux',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  }
]
</script>
