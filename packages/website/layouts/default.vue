<template>
  <div class="relative min-h-screen overflow-x-hidden">
    <Navbar />
    <main class="flex-1 px-1 max-w-screen-lg px-2 m-auto">
      <slot />
    </main>
    <Footer />
  </div>
</template>
