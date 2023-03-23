<template>
  <div class="min-h-full">
    <HeaderNavBar />
    <!-- <AuthVerificationReminder class="my-4 layout-container" /> -->
    <main class="my-4 layout-container pb-20 mt-20">
      <slot />
    </main>
    <SingletonManagers />
  </div>
</template>
