const ghpages = require('gh-pages')

ghpages.publish(
  'public',
  {
    branch: 'main',
    repo: 'https://github.com/Vallista/vallista.github.io.git'
  },
  function (err) {
    console.log(err)
  }
)
