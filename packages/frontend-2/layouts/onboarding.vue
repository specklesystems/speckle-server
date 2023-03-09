<template>
  <div class="w-screen h-screen overflow-hidden">
    <ClientOnly>
      <slot />
    </ClientOnly>
    <SingletonManagers />
  </div>
</template>
