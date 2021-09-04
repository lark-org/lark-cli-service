const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const fs = require('fs-extra')
const InterpolateHtmlPlugin = require('../webpack-plugins/interpolate-html-plugin')
const { appIndex, appSrc, appHtml, appPolyfill } = require('../variables/paths')
const variables = require('../variables/variables')
const paths = require('../variables/paths')

const { __DEV__, PUBLIC_PATH: publicPath, APP_ENV } = variables
const stringified = Object.keys(variables).reduce(
  (acc, key) => {
    acc[key] = JSON.stringify(variables[key])

    return acc
  },
  {
    'process.env.APP_ENV': JSON.stringify(APP_ENV)
  }
)

function getStyleLoaders(external) {
  function getLoaders(modules, useable) {
    let modulesQuery

    if (modules) {
      modulesQuery = {
        modules: true,
        localIdentName: '[name]--[local]-[hash:base64:5]'
      }
    }

    return [
      // eslint-disable-next-line no-nested-ternary
      useable
        ? 'style-loader/useable'
        : __DEV__
        ? 'style-loader'
        : MiniCssExtractPlugin.loader,
      {
        loader: 'css-loader',
        options: {
          // turn on sourceMap will cause FOUC
          // see https://github.com/webpack-contrib/css-loader/issues/613
          sourceMap: false,
          importLoaders: 1,
          ...modulesQuery
        }
      },
      {
        loader: 'postcss-loader',
        options: {
          // turn on sourceMap will cause FOUC
          // see https://github.com/webpack-contrib/css-loader/issues/613
          sourceMap: false
        }
      }
    ]
  }

  if (!external) {
    return [
      {
        resourceQuery: /modules/,
        use: getLoaders(true)
      },
      {
        resourceQuery: /useable/,
        use: getLoaders(false, true)
      },
      {
        use: getLoaders()
      }
    ]
  }

  return getLoaders()
}

module.exports = ({ entry = [], plugins = [] }) => {
  let minify

  if (!__DEV__) {
    minify = {
      removeComments: false,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true
    }
  }

  return {
    entry: [...entry, appPolyfill, appIndex],
    output: { publicPath },
    resolve: {
      alias: {
        '@': appSrc,
        src: appSrc
      },
      extensions: ['.ts', '.tsx', '.jsx', '.js', '.scss', '*.less']
    },
    module: {
      strictExportPresence: true,
      rules: [
        { parser: { requireEnsure: false } },
        {
          test: /\.(svg|png|jpe?g|ttf|eot|woff|woff2|gif)$/,
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: 'assets/[name].[hash:6].[ext]'
          }
        },
        {
          test: /\.(js|jsx|ts|tsx)$/,
          include: [appSrc],
          loader: 'babel-loader',
          options: {
            cacheDirectory: false,
            highlightCode: true,
            configFile: require.resolve('../.babel.config.js')
          }
        },
        {
          test: /\.wjs$/,
          include: [appSrc],
          use: [
            {
              loader: 'worker-loader',
              options: {
                inline: true,
                fallback: false,
                publicPath: '/workers/'
              }
            },
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: false,
                highlightCode: true
              }
            }
          ]
        },
        {
          test: /\.s[ac]ss$/,
          enforce: 'pre',
          include: [appSrc],
          use: [
            {
              loader: 'sass-loader',
              options: {
                // turn on sourceMap will cause FOUC
                // see https://github.com/webpack-contrib/css-loader/issues/613
                sourceMap: false
              }
            }
          ]
        },
        {
          test: /\.less$/,
          enforce: 'pre',
          include: [appSrc, /node_modules/],
          use: [
            {
              loader: 'less-loader',
              options: {
                sourceMap: false,
                globalVars: { theme: 'vira' },
                paths: ['node_modules']
              }
            }
          ]
        },
        {
          test: /\.(css|s[ac]ss|less)$/,
          include: [appSrc],
          oneOf: getStyleLoaders()
        },
        {
          test: /\.(css|s[ac]ss|less)$/,
          exclude: [appSrc],
          use: getStyleLoaders(true)
        },
        {
          test: /\.(png|jpg|svg|gif)$/,
          type: 'asset/resource',
          generator: {
            // [ext]前面自带"."
            filename: 'assets/[hash:8].[name][ext]'
          }
        }
      ]
    },
    cache: {
      type: 'filesystem',
      version: APP_ENV,
      cacheDirectory: paths.appWebpackCache,
      store: 'pack',
      buildDependencies: {
        defaultWebpack: ['webpack/lib/'],
        config: [__filename],
        tsconfig: [paths.appTsConfig, paths.appJsConfig].filter((f) =>
          fs.existsSync(f)
        )
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: appHtml,
        inject: __DEV__ ? 'body' : 'head',
        minify
      }),
      new webpack.DefinePlugin(stringified),
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, variables),
      ...plugins
    ].filter(Boolean)
  }
}
