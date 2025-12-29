import { SearchInput } from '@vallista/design-system'
import { useSearch } from '@shared/context/SearchContext'
import * as Styled from './Search.css'

export const Search = () => {
  const { search, setSearch } = useSearch()

  return (
    <div className={Styled.search}>
      <SearchInput
        value={search}
        onChange={setSearch}
        onReset={() => setSearch('')}
        size='small'
        placeholder='검색..'
      />
    </div>
  )
}
