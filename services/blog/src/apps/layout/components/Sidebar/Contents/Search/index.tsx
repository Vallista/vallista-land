import { SearchInput } from '@vallista/design-system'
import { useSearch } from './useSearch'

import * as Styled from './index.style'

export const Search = () => {
  const { search, setSearch } = useSearch()

  return (
    <div className={Styled.search}>
      <SearchInput
        value={search}
        onReset={() => setSearch('')}
        onChange={setSearch}
        size='small'
        placeholder='검색..'
      />
    </div>
  )
}
