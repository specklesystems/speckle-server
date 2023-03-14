<template>
  <div class="h-14">
    <Disclosure
      v-slot="{ open }"
      as="nav"
      class="bg-foundation shadow transition fixed w-full z-10"
    >
      <div class="px-4">
        <div class="flex h-14 transition-all justify-between">
          <div class="flex items-center">
            <HeaderLogoBlock :active="false" class="mr-0" />
            <!-- <div class="w-20 mr-2"><LogoTextWhite /></div> -->
            <div class="hidden sm:flex flex-shrink-0 items-center">
              <HeaderNavLink to="/" name="Dashboard" :separator="true"></HeaderNavLink>
              <PortalTarget name="navigation"></PortalTarget>
            </div>
          </div>
          <div class="hidden sm:flex sm:items-center items-center">
            <div class="flex items-center">
              <PortalTarget name="secondary-actions"></PortalTarget>
              <PortalTarget name="primary-actions"></PortalTarget>

              <!-- Profile dropdown -->
              <HeaderNavNotifications />
              <HeaderNavUserMenu />
            </div>
          </div>
          <div class="-mr-2 flex items-center sm:hidden">
            <!-- Mobile menu button -->
            <DisclosureButton
              class="inline-flex items-center justify-center rounded-md bg-foundation p-2 text-foreground-3 hover:bg-foundation-focus hover:text-foreground-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:dark:ring-blue-900 ring-offset-white dark:ring-offset-black focus:ring-offset-2"
            >
              <span class="sr-only">Open main menu</span>
              <Bars3Icon v-if="!open" class="block h-6 w-6" aria-hidden="true" />
              <XMarkIcon v-else class="block h-6 w-6" aria-hidden="true" />
            </DisclosureButton>
          </div>
        </div>
      </div>

      <DisclosurePanel class="sm:hidden" on-pointerleave="">
        <div class="border-t border-foundation-focus pt-4 pb-4">
          <div class="flex items-center px-4">TODO: Missing mobile design</div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  </div>
</template>
<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/solid'

const { showNavbar } = useTourStageState().value
</script>
