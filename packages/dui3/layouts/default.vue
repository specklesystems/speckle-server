<template>
  <div class="relative min-h-screen flex flex-col">
    <HeaderNavBar />
    <main class="flex-1 mt-10 px-1 max-[275px]:px-0">
      <slot />
    </main>
  </div>
</template>
