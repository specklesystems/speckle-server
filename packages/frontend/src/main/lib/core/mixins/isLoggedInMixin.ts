import Vue from 'vue'
import { useIsLoggedInQuery } from '@/graphql/generated/graphql'
/**
 * Mixin for checking if user is logged in through Apollo Client. Use the reactive 'isLoggedIn' data property
 * to check if a user is logged in.
 */
export const IsLoggedInMixin = Vue.extend({
  data: () => ({
    /**
     * Whether or not the user is currently logged in. Resolved through
     * the `user` query.
     */
    isLoggedIn: false
  }),
  apollo: {
    isLoggedIn: useIsLoggedInQuery<Vue & { isLoggedIn: boolean }>({
      update: (data) => !!data.user?.id
    })
  }
})
