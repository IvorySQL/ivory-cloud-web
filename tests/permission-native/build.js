const path = require('path')
const Service = require('@vue/cli-service/lib/Service')
const webpack = require('webpack')

// Run from a complete project checkout with its existing dependencies.
// Use its actual Vue/Babel/style loaders and webpack require.context support.
process.env.NODE_ENV = 'development'
const root = path.resolve(__dirname, '../..')
const service = new Service(root)
service.init('development')
const config = service.resolveWebpackConfig()
config.entry = { contract: path.join(__dirname, 'entry.js') }
config.target = 'node'
config.output = {
  ...config.output,
  path: path.join(__dirname, '.bundle'),
  filename: 'contract.js',
  libraryTarget: 'commonjs2'
}
config.devtool = false
config.optimization = { ...config.optimization, minimize: false, splitChunks: false, runtimeChunk: false }
config.plugins = config.plugins.filter(plugin => ![
  'HtmlWebpackPlugin', 'PreloadPlugin', 'HotModuleReplacementPlugin'
].includes(plugin.constructor.name))
webpack(config, (error, stats) => {
  if (error) {
    console.error(error)
    process.exitCode = 1
    return
  }
  if (stats.hasErrors()) {
    console.error(stats.toString({ all: false, errors: true }))
    process.exitCode = 1
    return
  }
  console.log('Production store/router contract bundle built')
})
