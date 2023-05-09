import typescript from "@rollup/plugin-typescript";
export default {
  input: "packages/vue/src/index.ts",
  output: [
    {
      formate: "cjs",
      file: "packages/vue/dist/ass-vue.cjs.js",
    },

    {
      formate: "es",
      file: "packages/vue/dist/ass-vue.esm.js",
    },
  ],
  plugins: [typescript()],
};
