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
const cssRegex = /\.css$/
const cssModuleRegex = /\.module\.css$/
const sassRegex = /\.(scss|sass)$/
const sassModuleRegex = /\.module\.(scss|sass)$/

const useTypeScript = fs.existsSync(paths.appTsConfig)

function getStyleLoaders(cssOptions, preProcessor) {
  const loaders = [
    // eslint-disable-next-line no-nested-ternary
    __DEV__ ? require.resolve('style-loader') : MiniCssExtractPlugin.loader,
    {
      loader: require.resolve('css-loader'),
      options: {
        // turn on sourceMap will cause FOUC
        // see https://github.com/webpack-contrib/css-loader/issues/613
        sourceMap: false,
        importLoaders: 1,
        ...cssOptions
      }
    },
    {
      loader: require.resolve('postcss-loader'),
      options: {
        // Necessary for external CSS imports to work
        // https://github.com/facebook/create-react-app/issues/2677
        postcssOptions: {
          plugins: () => [
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
  ].filter(Boolean)

  if (preProcessor) {
    loaders.push(
      {
        loader: require.resolve('resolve-url-loader'),
        options: {
          root: paths.appSrc
        }
      },
      {
        loader: require.resolve(preProcessor),
        options: {
          sourceMap: true
        }
      }
    )
  }
  return loaders
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
      extensions: ['.ts', '.tsx', '.jsx', '.js', '.scss', '*.less']
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
          test: cssRegex,
          exclude: cssModuleRegex,
          use: getStyleLoaders({
            importLoaders: 1,
            modules: {
              mode: 'icss'
            }
          }),
          // Don't consider CSS imports dead code even if the
          // containing package claims to have no side effects.
          // Remove this when webpack adds a warning or an error for this.
          // See https://github.com/webpack/webpack/issues/6571
          sideEffects: true
        },
        // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
        // using the extension .module.css
        {
          test: cssModuleRegex,
          use: getStyleLoaders({
            importLoaders: 1,
            modules: {
              mode: 'local',
              getLocalIdent: getCSSModuleLocalIdent
            }
          })
        },
        // Opt-in support for SASS (using .scss or .sass extensions).
        // By default we support SASS Modules with the
        // extensions .module.scss or .module.sass
        {
          test: sassRegex,
          exclude: sassModuleRegex,
          use: getStyleLoaders(
            {
              importLoaders: 3,
              modules: {
                mode: 'icss'
              }
            },
            'sass-loader'
          ),
          // Don't consider CSS imports dead code even if the
          // containing package claims to have no side effects.
          // Remove this when webpack adds a warning or an error for this.
          // See https://github.com/webpack/webpack/issues/6571
          sideEffects: true
        },
        // Adds support for CSS Modules, but using SASS
        // using the extension .module.scss or .module.sass
        {
          test: sassModuleRegex,
          use: getStyleLoaders(
            {
              importLoaders: 3,
              modules: {
                mode: 'local',
                getLocalIdent: getCSSModuleLocalIdent
              }
            },
            'sass-loader'
          )
        },
        {
          // Exclude `js` files to keep "css" loader working as it injects
          // its runtime that would otherwise be processed through "file" loader.
          // Also exclude `html` and `json` extensions so they get processed
          // by webpacks internal loaders.
          exclude: [/^$/, /\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
          type: 'asset/resource'
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
        inject: __DEV__ ? 'body' : 'head',
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
