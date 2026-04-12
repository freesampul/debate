/** @type {import('@babel/core').ConfigFunction} */
module.exports = function (api) {
  api.cache(true)
  return {
    // Required for Expo Router + env; also auto-injects `react-native-worklets/plugin`
    // when worklets + reanimated are installed (Reanimated 4).
    presets: ['babel-preset-expo'],
  }
}
