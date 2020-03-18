function getHtmlWebpackOptions (pluginArgs) {
  return pluginArgs && pluginArgs.plugin && pluginArgs.plugin.options
    ? pluginArgs.plugin.options
    : {}
}

function getCompilationOptions (compilation) {
  return compilation && compilation.options ? compilation.options : {}
}

function getPublicPath ({ compilationOptions }) {
  const { output } = compilationOptions

  if (output && output.publicPath) {
    return output.publicPath
  }
}

function getResourceName (options, tag) {
  let name = tag.attributes && tag.attributes.href
  const publicPath = getPublicPath(options)

  if (!name) {
    return
  }
  if (publicPath) {
    name = name.replace(publicPath, '')
  }
  if (options.htmlWebpackOptions.hash) {
    name = name.split('?', 1)[0]
  }

  return name
}

function applyCustomAttribute (options, tag) {
  const { custom = [] } = options
  const name = getResourceName(options, tag)
  const alter = { ...tag }

  if (name && tag.tagName === 'link') {
    custom.forEach(option => {
      if (name.match(option.test)) {
        if (!alter.attributes) {
          alter.attributes = {}
        }
        alter.attributes[option.attribute] = option.value
      }
    })
  }

  return alter
}

module.exports = class StyleExtHtmlWebpackPlugin {
  constructor (HtmlWebpackPlugin, options = {}) {
    this.options = options
    this.compilationCallback = compilation => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tap(
        'StyleExtHtmlWebpackPlugin',
        this.alterAssetTagsCallback.bind(this, compilation)
      )
    }
    this.alterAssetTagsCallback = (compilation, pluginArgs, callback) => {
      const { custom = [] } = this.options
      const htmlWebpackOptions = getHtmlWebpackOptions(pluginArgs)
      const compilationOptions = getCompilationOptions(compilation)
      const options = {
        ...this.options,
        htmlWebpackOptions,
        compilationOptions,
      }

      if (custom.length) {
        pluginArgs.assetTags.styles.forEach(tag => {
          applyCustomAttribute(options, tag)
        })
      }

      if (callback) {
        callback(null, pluginArgs)
      }
    }
  }
  apply (compiler) {
    compiler.hooks.compilation.tap(
      'StyleExtHtmlWebpackPlugin',
      this.compilationCallback
    )
  }
}
