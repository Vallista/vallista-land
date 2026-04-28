import { createContext, useContext } from 'react';

export const BlogContext = createContext<boolean>(false);

export function useBlogEnabled(): boolean {
  return useContext(BlogContext);
}
