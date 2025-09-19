import { o as openBlock, c as createElementBlock, a as createBaseVNode, f as defineComponent, V as resolveDynamicComponent, m as computed, k as createBlock, w as withCtx, n as normalizeClass, l as createCommentVNode, q as renderSlot, d as createTextVNode, s as normalizeStyle } from "./entry.807a1084.js";
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
function render$1(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true"
  }, [
    createBaseVNode("path", {
      "fill-rule": "evenodd",
      d: "M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z",
      "clip-rule": "evenodd"
    })
  ]);
}
var OperatingSystem;
(function(OperatingSystem2) {
  OperatingSystem2["Windows"] = "win";
  OperatingSystem2["Mac"] = "mac";
  OperatingSystem2["Linux"] = "linux";
  OperatingSystem2["Android"] = "android";
  OperatingSystem2["iOS"] = "ios";
  OperatingSystem2["Other"] = "other";
})(OperatingSystem || (OperatingSystem = {}));
function resolveOsFromPlatform() {
  if (!globalThis || !globalThis.navigator || !("platform" in globalThis.navigator)) {
    return null;
  }
  const platform = (globalThis.navigator.platform || "").toLowerCase();
  if (platform.startsWith("mac"))
    return OperatingSystem.Mac;
  if (platform.startsWith("linux") || platform.startsWith("freebsd") || platform.startsWith("sunos"))
    return OperatingSystem.Linux;
  if (platform.startsWith("win"))
    return OperatingSystem.Windows;
  if (platform.startsWith("iphone") || platform.startsWith("ipad") || platform.startsWith("ipod"))
    return OperatingSystem.iOS;
  if (platform.startsWith("android"))
    return OperatingSystem.Android;
  return OperatingSystem.Other;
}
function resolveOsFromUserAgent() {
  if (!globalThis || !globalThis.navigator || !("userAgent" in globalThis.navigator)) {
    return null;
  }
  const userAgent = globalThis.navigator.userAgent;
  if (userAgent.includes("X11") || userAgent.includes("Linux"))
    return OperatingSystem.Linux;
  if (userAgent.includes("Win"))
    return OperatingSystem.Windows;
  if (userAgent.includes("Mac"))
    return OperatingSystem.Mac;
  if (userAgent.includes("Android"))
    return OperatingSystem.Android;
  if (userAgent.includes("iPhone") || userAgent.includes("iPad") || userAgent.includes("iPhone"))
    return OperatingSystem.iOS;
  return OperatingSystem.Other;
}
function getClientOperatingSystem() {
  if (!globalThis || !globalThis.navigator) {
    return OperatingSystem.Other;
  }
  const osFromPlatform = resolveOsFromPlatform();
  if (osFromPlatform && ![OperatingSystem.Other, OperatingSystem.Linux].includes(osFromPlatform)) {
    return osFromPlatform;
  }
  const userAgentPlatform = resolveOsFromUserAgent();
  return userAgentPlatform || OperatingSystem.Other;
}
var Xt = Object.defineProperty;
var Qt = (e, t, a) => t in e ? Xt(e, t, { enumerable: true, configurable: true, writable: true, value: a }) : e[t] = a;
var ce = (e, t, a) => (Qt(e, typeof t != "symbol" ? t + "" : t, a), a);
const de = /* @__PURE__ */ defineComponent({
  __name: "Button",
  props: {
    to: null,
    size: null,
    fullWidth: { type: Boolean },
    text: { type: Boolean },
    link: { type: Boolean },
    color: null,
    rounded: { type: Boolean },
    external: { type: Boolean },
    disabled: { type: Boolean },
    submit: { type: Boolean },
    iconLeft: null,
    iconRight: null,
    hideText: { type: Boolean },
    linkComponent: null,
    loading: { type: Boolean }
  },
  emits: ["click"],
  setup(e, { emit: t }) {
    const a = t, l = e, i = resolveDynamicComponent("NuxtLink"), s = resolveDynamicComponent("RouterLink"), m = computed(() => l.linkComponent ? l.linkComponent : l.external ? "a" : isObjectLike(i) ? i : isObjectLike(s) ? s : "a"), h = computed(() => {
      if (!l.to)
        return l.submit ? "submit" : "button";
    }), c = computed(() => l.disabled || l.loading), f = computed(() => l.loading ? render$1 : l.iconLeft), b = computed(() => {
      const I = [], y = {
        subtle: [
          "bg-transparent border-transparent text-foreground font-medium",
          "hover:bg-primary-muted disabled:hover:bg-transparent focus-visible:border-foundation"
        ],
        outline: [
          "bg-foundation border-outline-2 text-foreground font-medium",
          "hover:bg-primary-muted disabled:hover:bg-foundation focus-visible:border-foundation"
        ],
        danger: [
          "bg-danger border-danger-darker text-foundation font-medium",
          "hover:bg-danger-darker disabled:hover:bg-danger focus-visible:border-foundation"
        ],
        primary: [
          "bg-primary border-outline-1 text-foreground-on-primary font-semibold",
          "hover:bg-primary-focus disabled:hover:bg-primary focus-visible:border-foundation"
        ]
      };
      if (l.rounded && I.push("!rounded-full"), l.text || l.link)
        switch (l.color) {
          case "subtle":
            I.push("text-foreground");
            break;
          case "outline":
            I.push("text-foreground");
            break;
          case "danger":
            I.push("text-danger");
            break;
          case "primary":
          default:
            I.push("text-primary");
            break;
        }
      else
        switch (l.color) {
          case "subtle":
            I.push(...y.subtle);
            break;
          case "outline":
            I.push(...y.outline);
            break;
          case "danger":
            I.push(...y.danger);
            break;
          case "primary":
          default:
            I.push(...y.primary);
            break;
        }
      return I.join(" ");
    }), x = computed(() => {
      switch (l.size) {
        case "sm":
          return "h-6 text-body-2xs";
        case "lg":
          return "h-10 text-body-sm";
        default:
        case "base":
          return "h-8 text-body-xs";
      }
    }), d = computed(() => {
      if (l.text || l.link)
        return "p-0";
      const I = !!l.iconLeft, y = !!l.iconRight, P = l.hideText;
      switch (l.size) {
        case "sm":
          return P ? "w-6" : I ? "py-1 pr-2 pl-1" : y ? "py-1 pl-2 pr-1" : "px-2 py-1";
        case "lg":
          return P ? "w-10" : I ? "py-2 pr-6 pl-4" : y ? "py-2 pl-6 pr-4" : "px-6 py-2";
        case "base":
        default:
          return P ? "w-8" : I ? "py-1 pr-4 pl-2" : y ? "py-1 pl-4 pr-2" : "px-4 py-1";
      }
    }), v = computed(() => {
      const I = [
        "inline-flex justify-center items-center",
        "text-center select-none whitespace-nowrap",
        "outline outline-2 outline-transparent",
        "transition duration-200 ease-in-out focus-visible:outline-outline-4"
      ], y = [];
      return !l.text && !l.link && y.push("rounded-md border"), l.fullWidth ? y.push("w-full") : l.hideText || y.push("max-w-max"), c.value && y.push("cursor-not-allowed opacity-60"), [...I, ...y].join(" ");
    }), B = computed(() => [
      v.value,
      x.value,
      b.value,
      d.value
    ].join(" ")), w = computed(() => {
      const I = ["shrink-0"];
      switch (l.loading && I.push("animate-spin"), l.size) {
        case "sm":
          I.push("h-5 w-5 p-0.5");
          break;
        case "lg":
          I.push("h-6 w-6 p-1");
          break;
        case "base":
        default:
          I.push("h-6 w-6 p-1");
          break;
      }
      return I.join(" ");
    }), k = (I) => {
      if (c.value) {
        I.preventDefault(), I.stopPropagation(), I.stopImmediatePropagation();
        return;
      }
      a("click", I);
    };
    return (I, y) => (openBlock(), createBlock(resolveDynamicComponent(e.to ? m.value : "button"), {
      href: e.to,
      to: e.to,
      type: h.value,
      external: e.external,
      class: normalizeClass(B.value),
      disabled: c.value,
      role: "button",
      style: normalizeStyle(
        e.color !== "subtle" && !e.text ? "box-shadow: -1px 1px 4px 0px #0000000a inset; box-shadow: 0px 2px 2px 0px #0000000d;" : ""
      ),
      onClick: k
    }, {
      default: withCtx(() => [
        f.value ? (openBlock(), createBlock(resolveDynamicComponent(f.value), {
          key: 0,
          class: normalizeClass(w.value)
        }, null, 8, ["class"])) : createCommentVNode("", true),
        e.hideText ? createCommentVNode("", true) : renderSlot(I.$slots, "default", { key: 1 }, () => [
          createTextVNode("Button")
        ]),
        e.iconRight || !e.loading ? (openBlock(), createBlock(resolveDynamicComponent(e.iconRight), {
          key: 2,
          class: normalizeClass(w.value)
        }, null, 8, ["class"])) : createCommentVNode("", true)
      ]),
      _: 3
    }, 8, ["href", "to", "type", "external", "class", "disabled", "style"]));
  }
});
let wt = [];
function wl(e) {
  wt = wt ? e : e.slice();
}
wl([
  "sm:space-x-8",
  "md:space-x-8",
  "lg:space-x-8",
  "xl:space-x-8",
  "sm:space-x-2",
  "md:space-x-2",
  "lg:space-x-2",
  "xl:space-x-2",
  "sm:space-x-4",
  "md:space-x-4",
  "lg:space-x-4",
  "xl:space-x-4"
]);
const st = getClientOperatingSystem();
({
  "cmd-or-ctrl": st === OperatingSystem.Mac ? "Cmd" : "Ctrl",
  "alt-or-opt": st === OperatingSystem.Mac ? "Opt" : "Alt",
  shift: "Shift"
});
var ia = typeof global == "object" && global && global.Object === Object && global;
const ra = ia;
var ua = typeof self == "object" && self && self.Object === Object && self, ca = ra || ua || Function("return this")();
const qt = ca;
var da = qt.Symbol;
const Ee = da;
Ee ? Ee.toStringTag : void 0;
Ee ? Ee.toStringTag : void 0;
class pe extends Error {
  constructor(t, a) {
    t || (t = new.target.defaultMessage), super(t, a);
  }
}
ce(pe, "defaultMessage", "Unexpected error occurred");
class cr extends pe {
}
ce(cr, "defaultMessage", "An unexpected logic error occurred!");
class dr extends pe {
}
ce(dr, "defaultMessage", "Attempting to access an uninitialized resource");
class fr extends pe {
}
ce(fr, "defaultMessage", "getCurrentInstance() returned null. Method must be called at the top of a setup function");
class pr extends pe {
}
ce(pr, "defaultMessage", "Operation not supported in current (server or client) environment");
class Kt extends pe {
}
ce(Kt, "defaultMessage", "The selected file has a missing extension");
class Nt extends pe {
}
ce(Nt, "defaultMessage", "The selected file type is forbidden");
class Zt extends pe {
}
ce(Zt, "defaultMessage", "The selected file's size is too large");
function render(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true"
  }, [
    createBaseVNode("path", { d: "M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" })
  ]);
}
export {
  de as d,
  render as r
};
