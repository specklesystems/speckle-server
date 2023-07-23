<template>
  <nav
    class="fixed top-0 h-14 bg-foundation max-w-full w-full shadow hover:shadow-md transition z-20"
  >
    <div class="px-2">
      <div class="flex items-center h-14 transition-all justify-between">
        <div class="flex items-center">
          <HeaderLogoBlock :active="false" class="mr-0" />
          <div class="flex flex-shrink-0 items-center -ml-2 md:ml-0">
            <PortalTarget name="navigation"></PortalTarget>
          </div>
        </div>
        <div>
          <HeaderUserMenu />
        </div>
      </div>
    </div>
  </nav>
</template>
<script setup lang="ts"></script>
