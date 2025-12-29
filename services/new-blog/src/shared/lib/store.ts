import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Article, SearchParams } from '@shared/types'

interface BlogState {
  // Articles
  articles: Article[]
  currentArticle: Article | null
  isLoading: boolean
  error: string | null

  // Search & Filter
  searchParams: SearchParams
  searchQuery: string
  selectedTags: string[]

  // UI State
  isSidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'

  // Actions
  setArticles: (articles: Article[]) => void
  setCurrentArticle: (article: Article | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSearchQuery: (query: string) => void
  setSelectedTags: (tags: string[]) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  resetSearch: () => void
}

export const useBlogStore = create<BlogState>()(
  persist(
    (set, _get) => ({
      // Initial state
      articles: [],
      currentArticle: null,
      isLoading: false,
      error: null,
      searchParams: {},
      searchQuery: '',
      selectedTags: [],
      isSidebarOpen: false,
      theme: 'system',

      // Actions
      setArticles: (articles) => set({ articles }),
      setCurrentArticle: (article) => set({ currentArticle: article }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedTags: (tags) => set({ selectedTags: tags }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setTheme: (theme) => set({ theme }),
      resetSearch: () => set({ searchQuery: '', selectedTags: [] })
    }),
    {
      name: 'blog-storage',
      partialize: (state) => ({
        theme: state.theme,
        searchQuery: state.searchQuery,
        selectedTags: state.selectedTags
      })
    }
  )
)
