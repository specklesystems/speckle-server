<template>
  <div>
    <HeaderNavBar />
    <div class="h-dvh w-dvh overflow-hidden flex flex-col">
      <div class="h-14 w-full shrink-0"></div>
      <div class="flex h-[calc(100dvh-3.5rem)]">
        <Sidebar />
        <main class="w-full h-full overflow-y-auto simple-scrollbar">
          <div class="container mx-auto px-12">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
