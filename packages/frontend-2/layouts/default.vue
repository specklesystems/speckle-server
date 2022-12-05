<template>
  <div class="min-h-full">
    <HeaderNavBar class="mb-6" />
    <AuthVerificationReminder class="my-4 layout-container" />
    <main class="my-4 layout-container pb-20">
      <slot />
    </main>
    <SingletonManagers />
  </div>
</template>
