module.exports = (api) => {
  api.cache(true)
  return {
    plugins: [
      "@emotion/babel-plugin",
    ],
  }
}
