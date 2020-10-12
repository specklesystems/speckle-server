import Vue from "vue"
import VueRouter from "vue-router"

Vue.use(VueRouter)

const routes = [
  {
    path: "/",
    name: "home",
    meta: {
      title: "Home | Speckle"
    },
    component: () => import("../views/Home.vue")
  },
  {
    path: "/streams",
    name: "streams",
    meta: {
      title: "Streams | Speckle"
    },
    component: () => import("../views/Streams.vue")
  },
  {
    path: "/streams/:id",
    name: "stream",
    meta: {
      title: "Stream | Speckle"
    },
    component: () => import("../views/Stream.vue")
  },
  {
    path: "/streams/:streamid/commits/:id",
    name: "commit",
    meta: {
      title: "Commit | Speckle"
    },
    component: () => import("../views/Commit.vue")
  },
  {
    path: "/help",
    name: "help",
    meta: {
      title: "Help | Speckle"
    },
    component: () => import("../views/Help.vue")
  },
  {
    path: "/about",
    name: "about",
    meta: {
      title: "About | Speckle"
    },
    component: () => import("../views/About.vue")
  },
  {
    path: "*",
    name: "notfound",
    meta: {
      title: "Not Found | Speckle"
    },
    component: () => import("../views/NotFound.vue")
  }
]

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
})

//TODO: include stream name in page title eg `My Cool Stream | Speckle`
router.afterEach((to, from) => {
  Vue.nextTick(() => {
    document.title = (to.meta && to.meta.title) || "Speckle"
  })
})

export default router
