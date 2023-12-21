import Vue from 'vue'
import { CombinedVueInstance } from 'vue/types/vue'

import { ApolloProvider } from '@vue/apollo-option'
import { VueApolloComponentOptions } from '@vue/apollo-option/types/options'
import { DollarApollo } from '@vue/apollo-option/types/vue-apollo'

type DataDef<Data, Props, V> = Data | ((this: Readonly<Props> & V) => Data)

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue, Data, Methods, Computed, PropsDef, Props> {
    apolloProvider?: ApolloProvider
    apollo?: VueApolloComponentOptions<
      Data extends DataDef<infer D, any, any>
        ? CombinedVueInstance<V, D, Methods, Computed, Props>
        : CombinedVueInstance<V, Data, Methods, Computed, Props>
    >
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $apolloProvider: ApolloProvider
    $apollo: DollarApollo<this>
  }
}
