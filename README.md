# LARK CLI 服务

## 安装

```bash
npm i @lark-org/lark-cli-service --save-dev
# OR
yarn add @lark-org/lark-cli-service --dev
```

## 使用命令

在一个 React 项目中，`@lark-org/lark-cli-service` 安装了一个名为 `lark-cli-service` 的命令。你可以在 npm scripts 中以 `lark-cli-service`、或者从终端中以 `./node_modules/.bin/lark-cli-service` 访问这个命令。

这是你使用默认 preset 的项目的 `package.json`：

```json
{
  "scripts": {
    "start": "lark-cli-service start",
    "build": "lark-cli-service build"
  }
}
```

你可以通过 npm 或 Yarn 调用这些 script：

```bash
npm run start
# OR
yarn start
```
