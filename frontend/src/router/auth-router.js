import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use( VueRouter )

const routes = [ {
    path: '/auth/login',
    name: 'Home',
    component: ( ) => import( '../views/Login.vue' )
  },{
    path: '/auth/register',
    name: 'Home',
    component: ( ) => import( '../views/Register.vue' )
  },
  {
    path: '/auth/authorize',
    name: 'About',
    component: ( ) => import( '../views/Authorize.vue' )
  }
]

const router = new VueRouter( {
  mode: 'history',
  base: process.env.BASE_URL,
  routes
} )

export default router