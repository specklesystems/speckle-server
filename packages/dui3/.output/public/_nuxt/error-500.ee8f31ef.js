import { u as useHead, o as openBlock, c as createElementBlock, a as createBaseVNode, t as toDisplayString, p as pushScopeId, e as popScopeId } from "./entry.807a1084.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper.cc2b3d55.js";
const error500_vue_vue_type_style_index_0_scoped_73b1dc10_lang = "";
const _withScopeId = (n) => (pushScopeId("data-v-73b1dc10"), n = n(), popScopeId(), n);
const _hoisted_1 = { class: "font-sans antialiased bg-white dark:bg-black text-black dark:text-white grid min-h-screen place-content-center overflow-hidden" };
const _hoisted_2 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ createBaseVNode("div", { class: "fixed -bottom-1/2 left-0 right-0 h-1/2 spotlight" }, null, -1));
const _hoisted_3 = { class: "max-w-520px text-center" };
const _hoisted_4 = ["textContent"];
const _hoisted_5 = ["textContent"];
const _sfc_main = {
  __name: "error-500",
  props: {
    appName: {
      type: String,
      default: "Nuxt"
    },
    version: {
      type: String,
      default: ""
    },
    statusCode: {
      type: Number,
      default: 500
    },
    statusMessage: {
      type: String,
      default: "Server error"
    },
    description: {
      type: String,
      default: "This page is temporarily unavailable."
    }
  },
  setup(__props) {
    const props = __props;
    useHead({
      title: `${props.statusCode} - ${props.statusMessage} | ${props.appName}`,
      script: [],
      style: [
        {
          children: `*,:before,:after{-webkit-box-sizing:border-box;box-sizing:border-box;border-width:0;border-style:solid;border-color:#e0e0e0}*{--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(14, 165, 233, .5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000}:root{-moz-tab-size:4;-o-tab-size:4;tab-size:4}body{margin:0;font-family:inherit;line-height:inherit}html{-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji";line-height:1.5}h1,p{margin:0}h1{font-size:inherit;font-weight:inherit}`
        }
      ]
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        _hoisted_2,
        createBaseVNode("div", _hoisted_3, [
          createBaseVNode("h1", {
            class: "text-8xl sm:text-10xl font-medium mb-8",
            textContent: toDisplayString(__props.statusCode)
          }, null, 8, _hoisted_4),
          createBaseVNode("p", {
            class: "text-xl px-8 sm:px-0 sm:text-4xl font-light mb-16 leading-tight",
            textContent: toDisplayString(__props.description)
          }, null, 8, _hoisted_5)
        ])
      ]);
    };
  }
};
const error500 = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-73b1dc10"]]);
export {
  error500 as default
};
