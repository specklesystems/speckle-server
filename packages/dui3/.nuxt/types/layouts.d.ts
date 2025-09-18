import { ComputedRef, Ref } from 'vue'
export type LayoutKey = "default"
declare module "/workspaces/speckle-server/packages/dui3/node_modules/nuxt/dist/pages/runtime/composables" {
  interface PageMeta {
    layout?: false | LayoutKey | Ref<LayoutKey> | ComputedRef<LayoutKey>
  }
}