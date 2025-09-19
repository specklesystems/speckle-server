import { j as useNuxtApp, M as useRouter, f as defineComponent, m as computed, N as hasProtocol, r as ref, B as onMounted, O as onBeforeUnmount, D as h, g as resolveComponent, P as parseURL, Q as parseQuery, R as withTrailingSlash, S as withoutTrailingSlash, U as navigateTo } from "./entry.807a1084.js";
const requestIdleCallback = globalThis.requestIdleCallback || ((cb) => {
  const start = Date.now();
  const idleDeadline = {
    didTimeout: false,
    timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
  };
  return setTimeout(() => {
    cb(idleDeadline);
  }, 1);
});
const cancelIdleCallback = globalThis.cancelIdleCallback || ((id) => {
  clearTimeout(id);
});
const onNuxtReady = (callback) => {
  const nuxtApp = useNuxtApp();
  if (nuxtApp.isHydrating) {
    nuxtApp.hooks.hookOnce("app:suspense:resolve", () => {
      requestIdleCallback(callback);
    });
  } else {
    requestIdleCallback(callback);
  }
};
async function preloadRouteComponents(to, router = useRouter()) {
  const { path, matched } = router.resolve(to);
  if (!matched.length) {
    return;
  }
  if (!router._routePreloaded) {
    router._routePreloaded = /* @__PURE__ */ new Set();
  }
  if (router._routePreloaded.has(path)) {
    return;
  }
  const promises = router._preloadPromises = router._preloadPromises || [];
  if (promises.length > 4) {
    return Promise.all(promises).then(() => preloadRouteComponents(to, router));
  }
  router._routePreloaded.add(path);
  const components = matched.map((component) => {
    var _a;
    return (_a = component.components) == null ? void 0 : _a.default;
  }).filter((component) => typeof component === "function");
  for (const component of components) {
    const promise = Promise.resolve(component()).catch(() => {
    }).finally(() => promises.splice(promises.indexOf(promise)));
    promises.push(promise);
  }
  await Promise.all(promises);
}
const firstNonUndefined = (...args) => args.find((arg) => arg !== void 0);
const DEFAULT_EXTERNAL_REL_ATTRIBUTE = "noopener noreferrer";
/*! @__NO_SIDE_EFFECTS__ */
function defineNuxtLink(options) {
  const componentName = options.componentName || "NuxtLink";
  const resolveTrailingSlashBehavior = (to, resolve) => {
    if (!to || options.trailingSlash !== "append" && options.trailingSlash !== "remove") {
      return to;
    }
    const normalizeTrailingSlash = options.trailingSlash === "append" ? withTrailingSlash : withoutTrailingSlash;
    if (typeof to === "string") {
      return normalizeTrailingSlash(to, true);
    }
    const path = "path" in to ? to.path : resolve(to).path;
    return {
      ...to,
      name: void 0,
      // named routes would otherwise always override trailing slash behavior
      path: normalizeTrailingSlash(path, true)
    };
  };
  return /* @__PURE__ */ defineComponent({
    name: componentName,
    props: {
      // Routing
      to: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      href: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      // Attributes
      target: {
        type: String,
        default: void 0,
        required: false
      },
      rel: {
        type: String,
        default: void 0,
        required: false
      },
      noRel: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Prefetching
      prefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      noPrefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Styling
      activeClass: {
        type: String,
        default: void 0,
        required: false
      },
      exactActiveClass: {
        type: String,
        default: void 0,
        required: false
      },
      prefetchedClass: {
        type: String,
        default: void 0,
        required: false
      },
      // Vue Router's `<RouterLink>` additional props
      replace: {
        type: Boolean,
        default: void 0,
        required: false
      },
      ariaCurrentValue: {
        type: String,
        default: void 0,
        required: false
      },
      // Edge cases handling
      external: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Slot API
      custom: {
        type: Boolean,
        default: void 0,
        required: false
      }
    },
    setup(props, { slots }) {
      const router = useRouter();
      const to = computed(() => {
        const path = props.to || props.href || "";
        return resolveTrailingSlashBehavior(path, router.resolve);
      });
      const isExternal = computed(() => {
        if (props.external) {
          return true;
        }
        if (props.target && props.target !== "_self") {
          return true;
        }
        if (typeof to.value === "object") {
          return false;
        }
        return to.value === "" || hasProtocol(to.value, { acceptRelative: true });
      });
      const prefetched = ref(false);
      const el = ref(null);
      const elRef = (ref2) => {
        var _a;
        el.value = props.custom ? (_a = ref2 == null ? void 0 : ref2.$el) == null ? void 0 : _a.nextElementSibling : ref2 == null ? void 0 : ref2.$el;
      };
      {
        const shouldPrefetch = props.prefetch !== false && props.noPrefetch !== true && props.target !== "_blank" && !isSlowConnection();
        if (shouldPrefetch) {
          const nuxtApp = useNuxtApp();
          let idleId;
          let unobserve = null;
          onMounted(() => {
            const observer = useObserver();
            onNuxtReady(() => {
              idleId = requestIdleCallback(() => {
                var _a;
                if ((_a = el == null ? void 0 : el.value) == null ? void 0 : _a.tagName) {
                  unobserve = observer.observe(el.value, async () => {
                    unobserve == null ? void 0 : unobserve();
                    unobserve = null;
                    const path = typeof to.value === "string" ? to.value : router.resolve(to.value).fullPath;
                    await Promise.all([
                      nuxtApp.hooks.callHook("link:prefetch", path).catch(() => {
                      }),
                      !isExternal.value && preloadRouteComponents(to.value, router).catch(() => {
                      })
                    ]);
                    prefetched.value = true;
                  });
                }
              });
            });
          });
          onBeforeUnmount(() => {
            if (idleId) {
              cancelIdleCallback(idleId);
            }
            unobserve == null ? void 0 : unobserve();
            unobserve = null;
          });
        }
      }
      return () => {
        var _a, _b, _c;
        if (!isExternal.value) {
          const routerLinkProps = {
            ref: elRef,
            to: to.value,
            activeClass: props.activeClass || options.activeClass,
            exactActiveClass: props.exactActiveClass || options.exactActiveClass,
            replace: props.replace,
            ariaCurrentValue: props.ariaCurrentValue,
            custom: props.custom
          };
          if (!props.custom) {
            if (prefetched.value) {
              routerLinkProps.class = props.prefetchedClass || options.prefetchedClass;
            }
            routerLinkProps.rel = props.rel;
          }
          return h(
            resolveComponent("RouterLink"),
            routerLinkProps,
            slots.default
          );
        }
        const href = typeof to.value === "object" ? (_b = (_a = router.resolve(to.value)) == null ? void 0 : _a.href) != null ? _b : null : to.value || null;
        const target = props.target || null;
        const rel = props.noRel ? null : firstNonUndefined(props.rel, options.externalRelAttribute, href ? DEFAULT_EXTERNAL_REL_ATTRIBUTE : "") || null;
        const navigate = () => navigateTo(href, { replace: props.replace });
        if (props.custom) {
          if (!slots.default) {
            return null;
          }
          return slots.default({
            href,
            navigate,
            get route() {
              if (!href) {
                return void 0;
              }
              const url = parseURL(href);
              return {
                path: url.pathname,
                fullPath: url.pathname,
                get query() {
                  return parseQuery(url.search);
                },
                hash: url.hash,
                // stub properties for compat with vue-router
                params: {},
                name: void 0,
                matched: [],
                redirectedFrom: void 0,
                meta: {},
                href
              };
            },
            rel,
            target,
            isExternal: isExternal.value,
            isActive: false,
            isExactActive: false
          });
        }
        return h("a", { ref: el, href, rel, target }, (_c = slots.default) == null ? void 0 : _c.call(slots));
      };
    }
  });
}
const __nuxt_component_0 = /* @__PURE__ */ defineNuxtLink({ componentName: "NuxtLink" });
function useObserver() {
  const nuxtApp = useNuxtApp();
  if (nuxtApp._observer) {
    return nuxtApp._observer;
  }
  let observer = null;
  const callbacks = /* @__PURE__ */ new Map();
  const observe = (element, callback) => {
    if (!observer) {
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const callback2 = callbacks.get(entry.target);
          const isVisible = entry.isIntersecting || entry.intersectionRatio > 0;
          if (isVisible && callback2) {
            callback2();
          }
        }
      });
    }
    callbacks.set(element, callback);
    observer.observe(element);
    return () => {
      callbacks.delete(element);
      observer.unobserve(element);
      if (callbacks.size === 0) {
        observer.disconnect();
        observer = null;
      }
    };
  };
  const _observer = nuxtApp._observer = {
    observe
  };
  return _observer;
}
function isSlowConnection() {
  const cn = navigator.connection;
  if (cn && (cn.saveData || /2g/.test(cn.effectiveType))) {
    return true;
  }
  return false;
}
export {
  __nuxt_component_0 as _
};
