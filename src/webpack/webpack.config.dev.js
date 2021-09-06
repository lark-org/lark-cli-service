const path = require('path')
const webpack = require('webpack')
const { merge } = require('webpack-merge')
const ignoredFiles = require('react-dev-utils/ignoredFiles')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const evalSourceMapMiddleware = require('react-dev-utils/evalSourceMapMiddleware')
const { appPublic, appSrc } = require('../variables/paths')
const { PUBLIC_PATH } = require('../variables/variables')
const configFactory = require('./webpack.config')
const { processWebpackConfig } = require('../utils/custom-config')

module.exports = () =>
  processWebpackConfig(
    merge(
      configFactory({
        plugins: [
          new webpack.HotModuleReplacementPlugin(),
          new CaseSensitivePathsPlugin()
        ]
      }),
      {
        mode: 'development',
        devtool: 'cheap-module-source-map',
        output: {
          pathinfo: true,
          filename: '[name].js',
          chunkFilename: '[id].chunk.js',
          // see https://github.com/webpack/webpack/issues/6642#issuecomment-370222543
          globalObject: 'this',
          devtoolModuleFilenameTemplate: (info) =>
            path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')
        },
        devServer: {
          client: {
            overlay: true
          },
          allowedHosts: 'all',
          // Enable gzip compression of generated files
          compress: true,
          // Silence WebpackDevServer's own logs since they're generally not useful.
          // It will still show compile warnings and errors with this setting.
          static: {
            // By default WebpackDevServer serves physical files from current directory
            // in addition to all the virtual build products that it serves from memory.
            // This is confusing because those files won’t automatically be available in
            // production build folder unless we copy them. However, copying the whole
            // project directory is dangerous because we may expose sensitive files.
            // Instead, we establish a convention that only files in `public` directory
            // get served. Our build script will copy `public` into the `build` folder.
            // In `index.html`, you can get URL of `public` folder with %PUBLIC_URL%:
            // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
            // In JavaScript code, you can access it with `process.env.PUBLIC_URL`.
            // Note that we only recommend to use `public` folder as an escape hatch
            // for files like `favicon.ico`, `manifest.json`, and libraries that are
            // for some reason broken when imported through webpack. If you just want to
            // use an image, put it in `src` and `import` it from JavaScript instead.
            directory: appPublic,
            publicPath: [PUBLIC_PATH],
            // By default files from `contentBase` will not trigger a page reload.
            watch: {
              // Reportedly, this avoids CPU overload on some systems.
              // https://github.com/facebook/create-react-app/issues/293
              // src/node_modules is not ignored to support absolute imports
              // https://github.com/facebook/create-react-app/issues/1065
              ignored: ignoredFiles(appSrc)
            }
          },
          devMiddleware: {
            // It is important to tell WebpackDevServer to use the same "publicPath" path as
            // we specified in the webpack config. When homepage is '.', default to serving
            // from the root.
            // remove last slash so user can land on `/test` instead of `/test/`
            publicPath: PUBLIC_PATH.slice(0, -1)
          },
          host: '0.0.0.0',
          historyApiFallback: {
            disableDotRule: true,
            index: PUBLIC_PATH
          },
          onBeforeSetupMiddleware(devServer) {
            devServer.app.use(evalSourceMapMiddleware(devServer))
          }
        }
      }
    )
  )
