/* eslint-disable global-require */
const webpack = require('webpack')
const resolve = require('resolve')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin')
const fs = require('fs-extra')
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent')
const typescriptFormatter = require('react-dev-utils/typescriptFormatter')

const ForkTsCheckerWebpackPlugin = require('react-dev-utils/ForkTsCheckerWebpackPlugin')
const postcssNormalize = require('postcss-normalize')

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
const imageInlineSizeLimit = parseInt(
  process.env.IMAGE_INLINE_SIZE_LIMIT || '10000',
  10
)
const useTypeScript = fs.existsSync(paths.appTsConfig)

function getStyleLoaders(external) {
  function getLoaders(modules) {
    let modulesQuery

    if (modules) {
      modulesQuery = {
        modules: true,
        localIdentName: getCSSModuleLocalIdent
      }
    }

    return [
      // eslint-disable-next-line no-nested-ternary
      __DEV__ ? require.resolve('style-loader') : MiniCssExtractPlugin.loader,
      {
        loader: require.resolve('css-loader'),
        options: {
          // turn on sourceMap will cause FOUC
          // see https://github.com/webpack-contrib/css-loader/issues/613
          sourceMap: false,
          importLoaders: 1,
          ...modulesQuery
        }
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          // Necessary for external CSS imports to work
          // https://github.com/facebook/create-react-app/issues/2677
          postcssOptions: {
            plugins: [
              require('postcss-flexbugs-fixes'),
              require('postcss-preset-env')({
                autoprefixer: {
                  flexbox: 'no-2009'
                },
                stage: 3
              }),
              // Adds PostCSS Normalize as the reset css with default options,
              // so that it honors browserslist config in package.json
              // which in turn let's users customize the target behavior as per their needs.
              postcssNormalize()
            ],
            sourceMap: false
          }
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
      removeComments: true,
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
    output: {
      publicPath
    },
    resolve: {
      alias: {
        '@': appSrc,
        src: appSrc
      },
      extensions: ['.ts', '.tsx', '.jsx', '.js', '.scss', '.sass', '.less']
    },
    module: {
      strictExportPresence: true,
      rules: [
        {
          test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: imageInlineSizeLimit
            }
          }
        },
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          use: [require.resolve('@svgr/webpack')]
        },
        {
          test: /\.(ttf|eot|woff|woff2)$/,
          type: 'asset/inline'
        },
        {
          test: /\.less$/,
          enforce: 'pre',
          use: [
            {
              loader: require.resolve('resolve-url-loader'),
              options: {
                sourceMap: false,
                root: appSrc
              }
            },
            {
              loader: require.resolve('less-loader'),
              options: {
                // turn on sourceMap will cause FOUC
                // see https://github.com/webpack-contrib/css-loader/issues/613
                sourceMap: true
              }
            }
          ]
        },
        {
          test: /\.s[ac]ss$/,
          enforce: 'pre',
          use: [
            {
              loader: require.resolve('resolve-url-loader'),
              options: {
                sourceMap: false,
                root: appSrc
              }
            },
            {
              loader: require.resolve('sass-loader'),
              options: {
                // turn on sourceMap will cause FOUC
                // see https://github.com/webpack-contrib/css-loader/issues/613
                sourceMap: true
              }
            }
          ]
        },
        {
          test: /\.(js|jsx|ts|tsx)$/,
          include: [appSrc],
          loader: require.resolve('babel-loader'),
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
              loader: require.resolve('worker-loader'),
              options: {
                inline: true,
                fallback: false,
                publicPath: '/workers/'
              }
            },
            {
              loader: require.resolve('babel-loader'),
              options: {
                cacheDirectory: false,
                highlightCode: true
              }
            }
          ]
        },
        {
          type: 'asset',
          resourceQuery: /url/ // *.svg?url
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
    stats: {
      errorDetails: true
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: appHtml,
        inject: !__DEV__ ? 'body' : 'head',
        minify
      }),
      new ModuleNotFoundPlugin(paths.appPath),
      new webpack.DefinePlugin(stringified),
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, variables),
      useTypeScript &&
        new ForkTsCheckerWebpackPlugin({
          typescript: resolve.sync('typescript', {
            basedir: paths.appNodeModules
          }),
          async: __DEV__,
          checkSyntacticErrors: true,
          resolveModuleNameModule: process.versions.pnp
            ? `${__dirname}/pnpTs.js`
            : undefined,
          resolveTypeReferenceDirectiveModule: process.versions.pnp
            ? `${__dirname}/pnpTs.js`
            : undefined,
          tsconfig: paths.appTsConfig,
          reportFiles: [
            // This one is specifically to match during CI tests,
            // as micromatch doesn't match
            // '../cra-template-typescript/template/src/App.tsx'
            // otherwise.
            '../**/src/**/*.{ts,tsx}',
            '**/src/**/*.{ts,tsx}',
            '!**/src/**/__tests__/**',
            '!**/src/**/?(*.)(spec|test).*',
            '!**/src/setupProxy.*',
            '!**/src/setupTests.*'
          ],
          silent: true,
          // The formatter is invoked directly in WebpackDevServerUtils during development
          formatter: !__DEV__ ? typescriptFormatter : undefined
        }),
      ...plugins
    ].filter(Boolean),
    performance: false
  }
}
