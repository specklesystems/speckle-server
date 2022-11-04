<template>
  <div class="min-h-full">
    <HeaderNavBar />
    <div class="pt-20 pb-3 container mx-auto">
      <slot />
    </div>
    <SingletonManagers />
  </div>
</template>
