import { ComputedRef, Ref } from 'vue'
declare module "/home/bender/source/server-website/packages/website/node_modules/nuxt/dist/pages/runtime/composables" {
export type LayoutKey = "blank" | "default"
  interface PageMeta {
    layout?: false | LayoutKey | Ref<LayoutKey> | ComputedRef<LayoutKey>
  }
}