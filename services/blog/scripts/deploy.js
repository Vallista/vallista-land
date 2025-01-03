const TOKEN = process.argv[2] || null

const ghpages = require('gh-pages')

let isError = false

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
    isError = true
  }
)

if (!isError) {
  console.log('배포 성공!')
}
