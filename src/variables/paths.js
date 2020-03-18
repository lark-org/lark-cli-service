const { getProjectFilePath } = require("../utils/path");
const { getCustomConfig } = require("../utils/custom-config");

const appSrc = getProjectFilePath("./src");
const appBuild = getProjectFilePath("./dist");
const appPublic = getProjectFilePath("./public");

const appIndex = getProjectFilePath("./src/index.tsx");
const appPackageJson = getProjectFilePath("./package.json");
const yarnLockFile = getProjectFilePath("./yarn.lock");
const appPolyfill = require.resolve("../polyfills/index.js");
const appHtml = getProjectFilePath("./src/index.html");

const customPaths = getCustomConfig().paths;

const paths = {
  appIndex,
  appSrc,
  appBuild,
  appPublic,
  appHtml,
  appPolyfill,
  yarnLockFile,
  appPackageJson,
  ...customPaths
};

module.exports = {
  ...paths
};
