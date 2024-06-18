export { isUndefinedOrVoid } from '@speckle/shared'
export type {
  Nullable,
  Optional,
  MaybeNullOrUndefined,
  MaybeAsync,
  MaybeFalsy
} from '@speckle/shared'
import { ReactiveVar } from '@apollo/client/core'
import Vue, { VueConstructor } from 'vue'
import { LooseRequired } from 'vue/types/common'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GetReactiveVarType<V extends ReactiveVar<any>> = V extends ReactiveVar<
  infer T
>
  ? T
  : unknown

export type SetupProps<P = unknown> = Readonly<LooseRequired<P>>

// Copied from Vue typings & improved ergonomics
export type CombinedVueInstance<
  Instance extends Vue = Vue,
  Data = unknown,
  Methods = unknown,
  Computed = unknown,
  Props = unknown
> = Data & Methods & Computed & Props & Instance

export type ExtendedVue<
  Instance extends Vue = Vue,
  Data = unknown,
  Methods = unknown,
  Computed = unknown,
  Props = unknown
> = VueConstructor<CombinedVueInstance<Instance, Data, Methods, Computed, Props> & Vue>

export type VueWithMixins<
  A extends VueConstructor = VueConstructor,
  B extends VueConstructor = VueConstructor,
  C extends VueConstructor = VueConstructor,
  D extends VueConstructor = VueConstructor,
  E extends VueConstructor = VueConstructor
> = VueConstructor<
  Vue &
    InstanceType<A> &
    InstanceType<B> &
    InstanceType<C> &
    InstanceType<D> &
    InstanceType<E>
>

/**
 * Create Vue base class with the specified mixins and correctly returned TypeScript types
 * @deprecated Use Composition API instead
 * @returns
 */
export function vueWithMixins<
  A extends VueConstructor = VueConstructor,
  B extends VueConstructor = VueConstructor,
  C extends VueConstructor = VueConstructor,
  D extends VueConstructor = VueConstructor,
  E extends VueConstructor = VueConstructor
>(
  mixin1?: A,
  mixin2?: B,
  mixin3?: C,
  mixin4?: D,
  mixin5?: E
): VueWithMixins<A, B, C, D, E> {
  const mixins = [mixin1, mixin2, mixin3, mixin4, mixin5].filter(
    (m): m is A | B | C | D | E => !!m
  )

  return Vue.extend({
    mixins
  }) as VueWithMixins<A, B, C, D, E>
}
