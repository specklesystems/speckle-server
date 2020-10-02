import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Streams from '../views/Streams.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/streams',
    name: 'streams',
    component: Streams
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
