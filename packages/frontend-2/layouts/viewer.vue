<template>
  <div class="relative min-h-full">
    <ClientOnly>
      <HeaderNavBar class="relative z-20" />
    </ClientOnly>
    <main class="absolute top-0 left-0 z-10 h-[100dvh] w-screen">
      <slot />
    </main>
  </div>
</template>
