export function useArticles() {
  // const articles = loadMdxWithFolder('articles')
  // const filteredArticles = articles.filter((article) => !article.data.draft)

  return {
    articles: [],
    filteredArticles: []
  }
}
