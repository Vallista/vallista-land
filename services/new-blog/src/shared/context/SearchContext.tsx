import React, { createContext, useContext, useState, ReactNode } from 'react'

interface SearchContextType {
  search: string
  setSearch: (search: string) => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

interface SearchProviderProps {
  children: ReactNode
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [search, setSearch] = useState('')

  return <SearchContext.Provider value={{ search, setSearch }}>{children}</SearchContext.Provider>
}

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}
