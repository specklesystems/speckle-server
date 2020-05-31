import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use( VueRouter )

const routes = [ {
  path: '/auth/login',
  name: 'Login',
  component: ( ) => import( '../views/auth/Login.vue' )
}, {
  path: '/auth/register',
  name: 'Register',
  component: ( ) => import( '../views/auth/Registration.vue' )
} ]

const router = new VueRouter( {
  mode: 'history',
  base: process.env.BASE_URL,
  routes
} )

export default router