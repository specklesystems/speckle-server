<template>
  <div>
    <HeaderNavBar />
    <div class="h-dvh w-dvh overflow-hidden flex flex-col">
      <!-- Static Spacer to allow for absolutely positioned HeaderNavBar  -->
      <div class="h-14 w-full shrink-0"></div>

      <!-- Sidebar -->
      <div class="relative flex h-[calc(100dvh-3.5rem)]">
        <div class="h-full w-64 shrink-0 border-r border-outline-3 px-2 py-3">
          <Sidebar />
        </div>

        <main class="w-full h-full overflow-y-auto simple-scrollbar pt-8 pb-16">
          <div class="container mx-auto px-12">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
