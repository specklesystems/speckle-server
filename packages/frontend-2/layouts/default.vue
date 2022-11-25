<template>
  <div class="min-h-full">
    <HeaderNavBar class="mb-10" />
    <AuthVerificationReminder class="my-4 layout-container" />
    <main class="my-4 layout-container">
      <slot />
    </main>
    <SingletonManagers />
  </div>
</template>
