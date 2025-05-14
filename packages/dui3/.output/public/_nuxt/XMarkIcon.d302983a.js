import { V as getClientOperatingSystem, W as OperatingSystem, f as defineComponent, X as resolveDynamicComponent, m as computed, o as openBlock, k as createBlock, w as withCtx, n as normalizeClass, l as createCommentVNode, q as renderSlot, d as createTextVNode, s as normalizeStyle, c as createElementBlock, a as createBaseVNode } from "./entry.a64d143d.js";
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
var as = Object.defineProperty;
var rs = (e, t, o) => t in e ? as(e, t, { enumerable: true, configurable: true, writable: true, value: o }) : e[t] = o;
var ke = (e, t, o) => (rs(e, typeof t != "symbol" ? t + "" : t, o), o);
const he = /* @__PURE__ */ defineComponent({
  __name: "Button",
  props: {
    to: {},
    size: {},
    fullWidth: { type: Boolean },
    text: { type: Boolean },
    link: { type: Boolean },
    color: {},
    rounded: { type: Boolean },
    external: { type: Boolean },
    disabled: { type: Boolean },
    submit: { type: Boolean },
    iconLeft: {},
    iconRight: {},
    hideText: { type: Boolean },
    linkComponent: {},
    loading: { type: Boolean }
  },
  emits: ["click"],
  setup(e, { emit: t }) {
    const o = t, n = e, r = resolveDynamicComponent("NuxtLink"), s = resolveDynamicComponent("RouterLink"), p = computed(() => n.linkComponent ? n.linkComponent : n.external ? "a" : isObjectLike(r) ? r : isObjectLike(s) ? s : "a"), u = computed(() => {
      if (!n.to)
        return n.submit ? "submit" : "button";
    }), h = computed(() => n.disabled || n.loading), v = computed(
      () => n.loading ? Qe : n.iconLeft
    ), f = computed(() => {
      const C = [], B = {
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
      if (n.rounded && C.push("!rounded-full"), n.text || n.link)
        switch (n.color) {
          case "subtle":
            C.push("text-foreground");
            break;
          case "outline":
            C.push("text-foreground");
            break;
          case "danger":
            C.push("text-danger");
            break;
          case "primary":
          default:
            C.push("text-primary");
            break;
        }
      else
        switch (n.color) {
          case "subtle":
            C.push(...B.subtle);
            break;
          case "outline":
            C.push(...B.outline);
            break;
          case "danger":
            C.push(...B.danger);
            break;
          case "primary":
          default:
            C.push(...B.primary);
            break;
        }
      return C.join(" ");
    }), y = computed(() => {
      switch (n.size) {
        case "sm":
          return "h-6 text-body-2xs";
        case "lg":
          return "h-10 text-body-sm";
        default:
        case "base":
          return "h-8 text-body-xs";
      }
    }), i = computed(() => {
      if (n.text || n.link)
        return "p-0";
      const C = !!n.iconLeft, B = !!n.iconRight, M = n.hideText;
      switch (n.size) {
        case "sm":
          return M ? "w-6" : C ? "py-1 pr-2 pl-1" : B ? "py-1 pl-2 pr-1" : "px-2 py-1";
        case "lg":
          return M ? "w-10" : C ? "py-2 pr-6 pl-4" : B ? "py-2 pl-6 pr-4" : "px-6 py-2";
        case "base":
        default:
          return M ? "w-8" : C ? "py-0 pr-4 pl-2" : B ? "py-0 pl-4 pr-2" : "px-4 py-0";
      }
    }), b = computed(() => {
      const C = [
        "inline-flex justify-center items-center",
        "text-center select-none whitespace-nowrap",
        "outline outline-2 outline-transparent",
        "transition duration-200 ease-in-out focus-visible:outline-outline-4"
      ], B = [];
      return !n.text && !n.link && B.push("rounded-md border"), n.fullWidth ? B.push("w-full") : n.hideText || B.push("max-w-max"), h.value && B.push("cursor-not-allowed opacity-60"), [...C, ...B].join(" ");
    }), x = computed(() => [
      b.value,
      y.value,
      f.value,
      i.value
    ].join(" ")), T = computed(() => {
      const C = ["shrink-0"];
      switch (n.size) {
        case "sm":
          C.push("h-4 w-4 p-0.5");
          break;
        case "lg":
          C.push("h-6 w-6 p-1");
          break;
        case "base":
        default:
          C.push("h-6 w-6 p-1");
          break;
      }
      return C.join(" ");
    }), I = (C) => {
      if (h.value) {
        C.preventDefault(), C.stopPropagation(), C.stopImmediatePropagation();
        return;
      }
      o("click", C);
    };
    return (C, B) => (openBlock(), createBlock(resolveDynamicComponent(C.to ? p.value : "button"), {
      href: C.to,
      to: C.to,
      type: u.value,
      external: C.external,
      class: normalizeClass(x.value),
      disabled: h.value,
      role: "button",
      style: normalizeStyle(
        C.color !== "subtle" && !C.text ? "box-shadow: -1px 1px 4px 0px #0000000a inset; box-shadow: 0px 2px 2px 0px #0000000d;" : ""
      ),
      onClick: I
    }, {
      default: withCtx(() => [
        v.value ? (openBlock(), createBlock(resolveDynamicComponent(v.value), {
          key: 0,
          class: normalizeClass(T.value)
        }, null, 8, ["class"])) : createCommentVNode("", true),
        C.hideText ? createCommentVNode("", true) : renderSlot(C.$slots, "default", { key: 1 }, () => [
          B[0] || (B[0] = createTextVNode("Button"))
        ]),
        C.iconRight || !C.loading ? (openBlock(), createBlock(resolveDynamicComponent(C.iconRight), {
          key: 2,
          class: normalizeClass(T.value)
        }, null, 8, ["class"])) : createCommentVNode("", true)
      ]),
      _: 3
    }, 8, ["href", "to", "type", "external", "class", "disabled", "style"]));
  }
});
let Mt = [];
function Ol(e) {
  Mt = Mt ? e : e.slice();
}
Ol([
  "sm:space-x-6",
  "md:space-x-6",
  "lg:space-x-6",
  "xl:space-x-6",
  "sm:space-x-2",
  "md:space-x-2",
  "lg:space-x-2",
  "xl:space-x-2",
  "sm:space-x-4",
  "md:space-x-4",
  "lg:space-x-4",
  "xl:space-x-4"
]);
const Ce = (e, t) => {
  const o = e.__vccOpts || e;
  for (const [n, r] of t)
    o[n] = r;
  return o;
};
const mt = getClientOperatingSystem();
({
  "cmd-or-ctrl": mt === OperatingSystem.Mac ? "⌘" : "⌃",
  "alt-or-opt": mt === OperatingSystem.Mac ? "⌥" : "Alt",
  shift: "⇧"
});
var Sa = typeof global == "object" && global && global.Object === Object && global;
const Oa = Sa;
var Pa = typeof self == "object" && self && self.Object === Object && self, La = Oa || Pa || Function("return this")();
const Yt = La;
var Ma = Yt.Symbol;
const tt = Ma;
tt ? tt.toStringTag : void 0;
tt ? tt.toStringTag : void 0;
const yi = /* @__PURE__ */ defineComponent({
  __name: "Icon",
  props: {
    loading: { type: Boolean, default: true },
    size: { default: "base" }
  },
  setup(e) {
    const t = e, o = computed(() => {
      const n = [""];
      switch (n.push(t.loading ? "opacity-100" : "opacity-0"), t.size) {
        case "base":
          n.push("h-5 w-5");
          break;
        case "sm":
          n.push("h-4 w-4");
          break;
        case "lg":
          n.push("h-8 w-8");
          break;
      }
      return n.join(" ");
    });
    return (n, r) => (openBlock(), createElementBlock("svg", {
      class: normalizeClass(["spinner", o.value]),
      width: "32px",
      height: "40px",
      viewBox: "0 0 66 66",
      xmlns: "http://www.w3.org/2000/svg"
    }, r[0] || (r[0] = [
      createBaseVNode("circle", {
        class: "path",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "6",
        "stroke-linecap": "round",
        cx: "33",
        cy: "33",
        r: "30"
      }, null, -1)
    ]), 2));
  }
});
const Qe = /* @__PURE__ */ Ce(yi, [["__scopeId", "data-v-ee380fea"]]);
class Ie extends Error {
  constructor(t, o) {
    t || (t = new.target.defaultMessage), super(t, o);
  }
}
ke(Ie, "defaultMessage", "Unexpected error occurred");
class $i extends Ie {
}
ke($i, "defaultMessage", "An unexpected logic error occurred!");
class Ii extends Ie {
}
ke(Ii, "defaultMessage", "Attempting to access an uninitialized resource");
class Bi extends Ie {
}
ke(Bi, "defaultMessage", "getCurrentInstance() returned null. Method must be called at the top of a setup function");
class Si extends Ie {
}
ke(Si, "defaultMessage", "Operation not supported in current (server or client) environment");
class ss extends Ie {
}
ke(ss, "defaultMessage", "The selected file has a missing extension");
class ls extends Ie {
}
ke(ls, "defaultMessage", "The selected file type is forbidden");
class os extends Ie {
}
ke(os, "defaultMessage", "The selected file's size is too large");
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
  he as h,
  render as r
};
