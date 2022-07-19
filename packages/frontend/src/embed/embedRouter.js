import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '*',
    meta: {
      title: 'Embed View | Speckle'
    },
    component: () => import('@/embed/EmbedViewer.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

export default router
