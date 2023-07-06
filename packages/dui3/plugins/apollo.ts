// import { ApolloClient } from '@apollo/client/core'
// import { ApolloClients } from '@vue/apollo-composable'
// import { resolveClientConfig } from '~/lib/core/configs/apollo'

export default defineNuxtPlugin(() => {
  // Note: as accounts can be refreshed at runtime, i tried as an experiment
  // moving them to a composable (/lib/accounts/composables/setup.ts)
})

// export default defineNuxtPlugin((nuxtApp) => {
//   /**
//    * TODO: You can use `window` here to get credentials for all of the clients
//    * we need from the parent connectors. The following is just an example
//    */
//   const { $bindings } = useNuxtApp()

//   const apolloClients = {
//     latest: new ApolloClient(
//       // Imagine endpoint & token is resolved from window or something
//       resolveClientConfig({
//         httpEndpoint: 'https://latest.speckle.systems/graphql',
//         authToken: () => null
//       })
//     ),
//     xyz: new ApolloClient(
//       // Imagine endpoint & token is resolved from window or something
//       resolveClientConfig({
//         httpEndpoint: 'https://speckle.xyz/graphql',
//         authToken: () => null
//       })
//     )
//   }

//   nuxtApp.vueApp.provide(ApolloClients, apolloClients)
//   return {
//     provide: {
//       apolloClients
//     }
//   }
// })
