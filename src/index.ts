// ass-vue 的出口文件
import { baseCompile } from "./complier-core/src";
import * as runtimeDom from "./runtime-dom";
import { registerRuntimeCompiler } from "./runtime-dom";

export * from "./runtime-dom";

// export * from "./reactivity";

export { baseCompile } from "./complier-core/src";

function compileToFunction(template) {
  const { code } = baseCompile(template);
  //这里的code 就是我们代码compile 生成的代码；第一个参数是我们的函数参数
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

registerRuntimeCompiler(compileToFunction);
