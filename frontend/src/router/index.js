import Vue from "vue"
import VueRouter from "vue-router"

Vue.use(VueRouter)

const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/Home.vue")
  },
  {
    path: "/streams",
    name: "Streams",
    component: () => import("../views/Streams.vue")
  },
  {
    path: "/streams/:id",
    name: "Stream",
    component: () => import("../views/Stream.vue")
  },
  {
    path: "/help",
    name: "Help",
    component: () => import("../views/Help.vue")
  },
  {
    path: "/about",
    name: "About",
    component: () => import("../views/About.vue")
  },
  {
    path: "*",
    name: "Not Found",
    component: () => import("../views/NotFound.vue")
  }
]

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
})

export default router
