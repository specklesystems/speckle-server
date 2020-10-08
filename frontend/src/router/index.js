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
    name: "Streams",
    meta: {
      title: "Streams | Speckle"
    },
    component: () => import("../views/Streams.vue")
  },
  {
    path: "/streams/:id",
    name: "Stream",
    meta: {
      title: "Stream | Speckle"
    },
    component: () => import("../views/Stream.vue")
  },
  {
    path: "/help",
    name: "Help",
    meta: {
      title: "Help | Speckle"
    },
    component: () => import("../views/Help.vue")
  },
  {
    path: "/about",
    name: "About",
    meta: {
      title: "About | Speckle"
    },
    component: () => import("../views/About.vue")
  },
  {
    path: "*",
    name: "Not Found",
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
