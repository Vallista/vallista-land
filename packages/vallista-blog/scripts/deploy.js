const TOKEN = process.argv[2] || null
console.log(process.argv)

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
