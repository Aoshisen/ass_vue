import typescript from "rollup-plugin-typescript2";
import pkg from "./package.json" assert {type: "json"};
export default {
  input: "src/index.ts",
  output: [
    {
      format: "cjs",
      file: pkg.main,
    },
    {
      format: "es",
      file: pkg.module,
    },
  ],
  plugins: [typescript()],
};
