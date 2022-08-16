const TOKEN = process.argv[0] || null
console.log(TOKEN)

const ghpages = require('gh-pages')

ghpages.publish(
  'public',
  {
    branch: 'main',
    repo: TOKEN
      ? `https://vallista:${TOKEN}@github.com/Vallista/vallista.github.io.git`
      : 'https://github.com/Vallista/vallista.github.io.git'
  },
  function (err) {
    console.log(err)
  }
)
