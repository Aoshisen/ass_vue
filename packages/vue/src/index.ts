// ass-vue 的出口文件
export * from "@ass-vue/runtime-dom"
import { baseCompile } from "@ass-vue/complier-core";
import * as runtimeDom from "@ass-vue/runtime-dom";
import { registerRuntimeCompiler } from "@ass-vue/runtime-dom";
function compileToFunction(template) {
  const { code } = baseCompile(template);
  //这里的code 就是我们代码compile 生成的代码；第一个参数是我们的函数参数
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

registerRuntimeCompiler(compileToFunction);
