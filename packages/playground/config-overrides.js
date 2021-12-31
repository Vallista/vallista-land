// config-overrides.js
module.exports = function override(config, env) {
  // This line might break with other react-script versions
  delete config.module.rules[1].oneOf[2].include
  return config
}
