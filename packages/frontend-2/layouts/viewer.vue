<template>
  <div class="min-h-full relative">
    <HeaderNavBar class="mb-6 z-20 relative" />
    <main class="absolute w-screen h-screen top-0 left-0 z-10">
      <slot />
    </main>
    <SingletonManagers class="z-30" />
  </div>
</template>
