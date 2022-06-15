declare module 'vue-mixpanel' {
  declare const test: string
  declare const plugin: import('vue').PluginFunction<unknown>
  export default plugin
  export { test }
}
