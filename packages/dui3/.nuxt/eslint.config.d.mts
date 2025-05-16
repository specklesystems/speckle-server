import type { FlatConfigComposer } from "eslint-flat-config-utils"
import { defineFlatConfigs } from "@nuxt/eslint-config/flat"
import type { NuxtESLintConfigOptionsResolved } from "@nuxt/eslint-config/flat"

declare const configs: FlatConfigComposer
declare const options: NuxtESLintConfigOptionsResolved
declare const withNuxt: typeof defineFlatConfigs
export default withNuxt
export { withNuxt, defineFlatConfigs, configs, options }