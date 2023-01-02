<template>
  <div class="min-h-full">
    <HeaderNavBar class="mb-6" />
    <main class="absolute w-screen h-screen top-0 left-0">
      <slot />
    </main>
    <SingletonManagers />
  </div>
</template>
