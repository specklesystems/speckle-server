<template>
  <div class="min-h-full">
    <HeaderNavBar />
    <AuthVerificationReminder class="my-8 layout-columns-single" />
    <main class="my-4 layout-columns-single">
      <slot />
    </main>
    <SingletonManagers />
  </div>
</template>
