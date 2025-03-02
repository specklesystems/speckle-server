<template>
  <div v-if="navMenu">
    <NavigationMenuRoot v-model="currentTrigger">
      <NavigationMenuList class="center m-0 flex list-none">
        <template v-for="(item, idx) in navMenu.items">
          <template v-if="item._type == 'navMenuItem'">
            <NavigationMenuItem>
              <NavigationMenuLink :as="CommonNavButton" :to="item.url.current">
                {{ item.label }}
              </NavigationMenuLink>
            </NavigationMenuItem>
          </template>
          <template v-else>
            <NavigationMenuItem :as="CommonNavButton">
              <NavigationMenuTrigger class="flex items-center group">
                <span>{{ item.label }}</span>
                <ChevronDownIcon
                  :class="open ? 'rotate-180' : ''"
                  class="ml-[3px] h-3 w-3 transition duration-150 ease-in-out group-hover:rotate-180"
                  aria-hidden="true"
                />
              </NavigationMenuTrigger>
              <NavigationMenuContent
                class="data-[motion=from-start]:animate-enterFromLeft data-[motion=from-end]:animate-enterFromRight data-[motion=to-start]:animate-exitToLeft data-[motion=to-end]:animate-exitToRight"
              >
                <ul
                  class="m-0 grid list-none gap-2 grid-cols-4 p-6 max-w-screen-lg mx-auto"
                >
                  <NavigationMenuListItem
                    v-for="item in item.items"
                    :title="item.label"
                    href="/docs/primitives/overview/introduction"
                  >
                    {{ item.description }}
                  </NavigationMenuListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </template>
        </template>

        <NavigationMenuIndicator
          class="absolute data-[state=hidden]:opacity-0 duration-200 data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut top-full w-[--reka-navigation-menu-indicator-size] translate-x-[--reka-navigation-menu-indicator-position] mt-[1px] z-[100] flex h-[10px] items-end justify-center overflow-hidden transition-[all,transform_250ms_ease]"
        >
          <div
            class="relative top-[70%] h-[12px] w-[12px] rotate-[45deg] bg-foundation-2 border border-outline-2"
          />
        </NavigationMenuIndicator>
      </NavigationMenuList>

      <div
        class="fixed top-full -mt-4 left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] flex w-screen pb-2"
      >
        <NavigationMenuViewport
          class="w-full bg-neutral-50/90 dark:bg-neutral-950/90 border border-outline-2 shadow-md backdrop-blur-sm overflow-hidden data-[state=open]:animate-scaleIn data-[state=closed]:animate-scaleOut relative mt-[10px] h-[var(--reka-navigation-menu-viewport-height)] origin-[top_center] transition-[width,_height] duration-300"
        />
      </div>
    </NavigationMenuRoot>
  </div>
</template>

<script setup lang="ts">
import CommonNavButton from '~~/components/common/NavButton.vue'
import NavigationMenuListItem from './NavigationMenuListItem.vue'
import { ChevronDownIcon } from '@heroicons/vue/24/solid'
import {
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  NavigationMenuViewport
} from 'reka-ui'

const query = groq`
  *[_type == "navMenu"][0] {
    items
  }
`
const { data: navMenu } = useSanityQuery(query)
const currentTrigger = ref('')
</script>
