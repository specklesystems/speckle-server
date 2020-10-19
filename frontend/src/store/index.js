import Vue from "vue"
import Vuex from "vuex"
import gql from "graphql-tag"

Vue.use( Vuex )

export default new Vuex.Store( {
  state: {
    user: {}
  },
  mutations: {
    SET_USER( state, value ) {
      state.user = value
    }
  },
  actions: {
    // async getUser( { commit } ) {
    //   let user = gql `{ userQuery }`
    //   console.log( user )
    //   commit( 'SET_USER', user )
    // }
  },
  modules: {}
} )
