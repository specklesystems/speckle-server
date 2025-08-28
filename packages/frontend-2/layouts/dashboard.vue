<template>
  <div>
    <HeaderNavBar hide-user-nav />
    <div class="h-dvh w-dvh overflow-hidden flex flex-col">
      <!-- Static Spacer to allow for absolutely positioned HeaderNavBar  -->
      <div class="h-12 w-full shrink-0"></div>

      <div class="relative flex h-[calc(100dvh-3rem)]">
        <main class="w-full h-full overflow-y-auto simple-scrollbar">
          <div class="container w-full">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
