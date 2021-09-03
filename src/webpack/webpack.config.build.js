const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const safePostCssParser = require('postcss-safe-parser')
const { SourceMapDevToolPlugin } = require('webpack')
const merge = require('webpack-merge')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')
const StyleExtHtmlWebpackPlugin = require('../webpack-plugins/style-ext-html-webpack-plugin')
const { appSrc, appBuild } = require('../variables/paths')
const { PUBLIC_PATH } = require('../variables/variables')
const configFactory = require('./webpack.config')
const { processWebpackConfig } = require('../utils/custom-config')

module.exports = () =>
  processWebpackConfig(
    merge(
      configFactory({
        plugins: [
          new SourceMapDevToolPlugin({
            filename: '[file].map',
            publicPath: PUBLIC_PATH
          }),
          new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: 'css/[name].[contenthash:8].css',
            chunkFilename: 'css/[name].[contenthash:8].chunk.css'
          }),
          new ScriptExtHtmlWebpackPlugin({
            inline: [
              // https://github.com/webpack-contrib/mini-css-extract-plugin/issues/85
              // temporary fix style.js issue
              /styles.*\.js$/
            ],
            defaultAttribute: 'defer',
            custom: [
              {
                test: /\.js$/,
                attribute: 'onerror',
                value:
                  'window.__ERR_SCRIPTS__ = (window.__ERR_SCRIPTS__ || []).concat(this.src)'
              },
              {
                test: /\.js$/,
                attribute: 'crossorigin',
                value: 'anonymous'
              }
            ]
          }),
          new StyleExtHtmlWebpackPlugin(HtmlWebpackPlugin, {
            custom: [
              {
                test: /\.css$/,
                attribute: 'onerror',
                value: '__STYLE_LOAD_ERROR__(event)'
              }
            ]
          })
        ]
      }),
      {
        mode: 'production',
        devtool: false,
        externals: {
          // prettier-ignore
          react: 'React',
          'react-dom': 'ReactDOM',
          mobx: 'mobx',
          'mobx-react': 'mobxReact'
        },
        output: {
          path: appBuild,
          filename: 'js/[name].[chunkhash:8].js',
          chunkFilename: 'js/[name].[chunkhash:8].chunk.js',
          devtoolModuleFilenameTemplate: (info) =>
            path.relative(appSrc, info.absoluteResourcePath).replace(/\\/g, '/')
        },
        optimization: {
          minimize: true,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                parse: {
                  // we want terser to parse ecma 8 code. However, we don't want it
                  // to apply any minification steps that turns valid ecma 5 code
                  // into invalid ecma 5 code. This is why the 'compress' and 'output'
                  // sections only apply transformations that are ecma 5 safe
                  // https://github.com/facebook/create-react-app/pull/4234
                  ecma: 8
                },
                compress: {
                  ecma: 5,
                  warnings: false,
                  // Disabled because of an issue with Uglify breaking seemingly valid code:
                  // https://github.com/facebook/create-react-app/issues/2376
                  // Pending further investigation:
                  // https://github.com/mishoo/UglifyJS2/issues/2011
                  comparisons: false,
                  // Disabled because of an issue with Terser breaking valid code:
                  // https://github.com/facebook/create-react-app/issues/5250
                  // Pending further investigation:
                  // https://github.com/terser-js/terser/issues/120
                  inline: 2
                },
                mangle: {
                  safari10: true
                },
                output: {
                  ecma: 5,
                  comments: false,
                  // Turned on because emoji and regex is not minified properly using default
                  // https://github.com/facebook/create-react-app/issues/2488
                  ascii_only: true
                }
              },
              // Use multi-process parallel running to improve the build speed
              // Default number of concurrent runs: os.cpus().length - 1
              // Disabled on WSL (Windows Subsystem for Linux) due to an issue with Terser
              // https://github.com/webpack-contrib/terser-webpack-plugin/issues/21
              parallel: true,
              // Enable file caching
              cache: true,
              sourceMap: true
            }),
            // This is only used in production mode
            new OptimizeCSSAssetsPlugin({
              cssProcessorOptions: {
                parser: safePostCssParser,
                map: false
              }
            })
          ],
          moduleIds: 'hashed',
          chunkIds: 'named',
          splitChunks: {
            // 避免生成名字过长的 chunk
            name: false,
            cacheGroups: {
              // https://github.com/webpack-contrib/mini-css-extract-plugin/issues/85
              // 把这一段注释掉，会导致低端机无法正常运行（实验机 安卓 4.2.2，没有报错，只显示首屏的 loading 动画）
              // chunks 必须是 'all'
              // 初步估计是 css 的异步加载有问题，导致后续的 js 也没有正常加载
              styles: {
                name: 'styles',
                test: (module) =>
                  module.nameForCondition &&
                  /\.(css|s[ac]ss|less)$/.test(module.nameForCondition()) &&
                  !/^javascript/.test(module.type),
                chunks: 'all',
                enforce: true
              },
              vendors: {
                name: 'vendors',
                test: (module) =>
                  module.resource &&
                  /\.js$/.test(module.resource) &&
                  /node_modules/.test(module.resource),
                chunks: 'initial'
              }
            }
          },
          runtimeChunk: { name: 'runtime' }
        }
      }
    )
  )
