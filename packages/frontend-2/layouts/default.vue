<template>
  <div class="min-h-full">
    <HeaderNavBar />
    <AuthVerificationReminder class="my-8 layout-container" />
    <main class="my-4 layout-container">
      <slot />
    </main>
    <SingletonManagers />
  </div>
</template>
