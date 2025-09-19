import { d as de, r as render$3 } from "./XMarkIcon.6bcd47ad.js";
import { o as openBlock, c as createElementBlock, a as createBaseVNode, f as defineComponent, r as ref, g as resolveComponent, b as createVNode, w as withCtx, F as Fragment, h as renderList, i as unref, d as createTextVNode, j as useNuxtApp, k as createBlock, l as createCommentVNode, t as toDisplayString } from "./entry.807a1084.js";
function render$2(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true"
  }, [
    createBaseVNode("path", {
      "fill-rule": "evenodd",
      d: "M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z",
      "clip-rule": "evenodd"
    })
  ]);
}
function render$1(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true"
  }, [
    createBaseVNode("path", {
      "fill-rule": "evenodd",
      d: "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z",
      "clip-rule": "evenodd"
    })
  ]);
}
function render(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true"
  }, [
    createBaseVNode("path", {
      "fill-rule": "evenodd",
      d: "M3 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10z",
      "clip-rule": "evenodd"
    })
  ]);
}
const _hoisted_1 = { class: "flex flex-col space-y-2" };
const _hoisted_2 = /* @__PURE__ */ createBaseVNode("div", null, [
  /* @__PURE__ */ createBaseVNode("p", { class: "text-sm text-foreground-2 py-2 px-2" }, [
    /* @__PURE__ */ createTextVNode(" Do not expect these to save the day. They are just some "),
    /* @__PURE__ */ createBaseVNode("b", { class: "text-foreground-primary" }, "minor sanity checks"),
    /* @__PURE__ */ createTextVNode(" . ")
  ])
], -1);
const _hoisted_3 = { class: "flex space-x-2" };
const _hoisted_4 = { class: "text-xs max-w-full overflow-x-scroll simple-scrollbar py-2" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "test",
  setup(__props) {
    const { $testBindings } = useNuxtApp();
    const tests = ref([
      {
        name: "Simple call with parameters",
        test: async () => {
          await $testBindings.sayHi("Speckle", 3, false);
          return "ok";
        },
        status: 0,
        result: {}
      },
      {
        name: "Simple call with invalid parameters",
        test: async () => {
          try {
            await $testBindings.sayHi("Speckle", 0);
            return "not ok";
          } catch (e) {
            return "ok";
          }
        },
        status: 0,
        result: {}
      },
      {
        name: "Simple function call with no args and no result",
        test: async () => {
          const res = await $testBindings.goAway();
          return res === null || res === void 0 ? "ok" : "not ok";
        },
        status: 0,
        result: {}
      },
      {
        name: "Get a more complicated object from a method call",
        test: async () => {
          const res = await $testBindings.getComplexType();
          const key = Object.keys(res)[0];
          return key.toLowerCase()[0] === key[0] ? "ok" : "serialization gone wrong";
        },
        status: 0,
        result: {}
      },
      {
        name: "Simple event capture",
        test: async () => {
          await $testBindings.triggerEvent("emptyTestEvent");
          return "not ok";
        },
        status: 0,
        result: "not run yet"
      },
      {
        name: "Event capture with args",
        test: async () => {
          await $testBindings.triggerEvent("testEvent");
          return "not ok";
        },
        status: 0,
        result: "not run yet"
      }
    ]);
    const runTests = async () => {
      for (const test of tests.value) {
        test.result = null;
        test.status = 0;
      }
      for (const test of tests.value) {
        try {
          const res = await test.test();
          if (res === "ok") {
            test.status = 1;
          } else {
            test.status = 2;
          }
          test.result = res;
        } catch (e) {
          test.status = 2;
          test.result = e;
        }
      }
    };
    $testBindings.on("emptyTestEvent", () => {
      setTimeout(() => {
        console.log("sketchup sent event back", "emptyTestEvent");
        const myTest = tests.value.find((t) => t.name === "Simple event capture");
        console.log(myTest, "myTest");
        if (!myTest)
          return;
        myTest.status = 1;
        myTest.result = "got an event back, we are okay";
      }, 300);
    });
    $testBindings.on("testEvent", (args) => {
      setTimeout(() => {
        console.log(args, "testEvent");
        const myTest = tests.value.find((t) => t.name === "Event capture with args");
        console.log(myTest, "myTest");
        if (!myTest)
          return;
        myTest.status = 1;
        myTest.result = args;
      }, 300);
    });
    return (_ctx, _cache) => {
      const _component_FormButton = de;
      const _component_Portal = resolveComponent("Portal");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createVNode(_component_Portal, { to: "navigation" }, {
          default: withCtx(() => [
            createVNode(_component_FormButton, {
              to: "/",
              size: "sm",
              "icon-left": unref(render$2),
              class: "ml-2"
            }, {
              default: withCtx(() => [
                createTextVNode(" Back home ")
              ]),
              _: 1
            }, 8, ["icon-left"])
          ]),
          _: 1
        }),
        _hoisted_2,
        createVNode(_component_FormButton, {
          size: "xl",
          color: "card",
          "full-width": "",
          class: "sticky top-10 top-16",
          onClick: _cache[0] || (_cache[0] = ($event) => runTests())
        }, {
          default: withCtx(() => [
            createTextVNode(" Run Tests ")
          ]),
          _: 1
        }),
        (openBlock(true), createElementBlock(Fragment, null, renderList(unref(tests), (test) => {
          return openBlock(), createElementBlock("div", {
            key: test.name,
            class: "py-2 px-2 bg-foundation shadow hover:shadow-lg transition rounded-lg text-xs"
          }, [
            createBaseVNode("div", _hoisted_3, [
              createBaseVNode("div", null, [
                test.status === 0 ? (openBlock(), createBlock(unref(render), {
                  key: 0,
                  class: "w-4 h-4 text-primary"
                })) : createCommentVNode("", true),
                test.status === 1 ? (openBlock(), createBlock(unref(render$1), {
                  key: 1,
                  class: "w-4 h-4 text-success"
                })) : createCommentVNode("", true),
                test.status === 2 ? (openBlock(), createBlock(unref(render$3), {
                  key: 2,
                  class: "w-4 h-4 text-danger"
                })) : createCommentVNode("", true)
              ]),
              createBaseVNode("div", null, toDisplayString(test.name), 1)
            ]),
            createBaseVNode("div", _hoisted_4, [
              createBaseVNode("pre", null, toDisplayString(test), 1)
            ])
          ]);
        }), 128))
      ]);
    };
  }
});
export {
  _sfc_main as default
};
