<template>
  <div class="min-h-full">
    <HeaderNavBar />
    <main class="pt-20 pb-3 container layout-columns-single">
      <slot />
    </main>
    <SingletonManagers />
  </div>
</template>
