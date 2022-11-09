<template>
  <div class="min-h-full">
    <HeaderNavBar />
    <main class="pt-20 pb-3 layout-columns-single">
      <slot />
    </main>
    <SingletonManagers />
  </div>
</template>
