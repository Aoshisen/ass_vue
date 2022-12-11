# 1-1-setup环境-集成jest做单元测试-集成 ts

```bash
yarn init -y #初始化项目
```

```bash
npx tsc --init #集成ts，但是报错了，因为项目里面没有typescript,所以安装typescript

yarn add typescript --dev #然后再执行一下 npx tsc --init 就生成了tsconfig.json 文件
```

## 解决使用jest 方法的时候的报错 （test index.spec.ts）

```bash
yarn add jest @types/jest --dev  #但是报错信息还是没有解决 这时候就要去tsconfig.json 里面配置一下，让ts 使用jest 的类型申明文件
```

>让代码支持隐式的any类型,以及让ts使用jest 的类型声明文件

```json
{
    ...config,
    "types": ["jest"],                                      /* Specify type package names to be included without being referenced in a source file. */
    "noImplicitAny": false,                            /* Enable error reporting for expressions and declarations with an implied 'any' type. */
}
```

## 使用babel 转化jest 的 import 规范

> 因为jest是运行在node环境下面的，但是我们开发的环境是esm 规范，所以需要我们使用babel转换一下

F&Q 为什么不直接在package.json 文件里面指定我们 的type="module"

> 因为package.json是项目运行的环境，是项目本身的环境，而我们的jest是另外的一个项目，他的规范是自己定义的，而不是能够通过我们写的package.json 文件来规定的，况且jest的代码已经生成好了，我们如果要让他生成好的代码完美适应我们项目本身的环境的话，就还是需要Babel来转义一下

[jest 官方文档](https://jestjs.io/docs/getting-started)

```bash
yarn add --dev babel-jest @babel/core @babel/preset-env #安装转义需要的文件
yarn add --dev @babel/preset-typescript #使用typescript
```

配置Babel

```javascript
//babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ],
};
```

## 顺带一提，为了更好的测试请安装，插件jest，jest runner

[jest](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)
[jest runner](https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner)