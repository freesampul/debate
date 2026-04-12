const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Allow Metro to follow symlinks so the @debate-app/shared symlink in
// node_modules resolves correctly to the monorepo package.
config.resolver.unstable_enableSymlinks = true

// Watch the shared package source so Metro picks up changes.
const sharedRoot = path.resolve(__dirname, '../shared')
config.watchFolders = [...(config.watchFolders ?? []), sharedRoot]

module.exports = config
