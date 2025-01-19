import React, { createContext, useContext } from 'react';
import { useRssFeed } from '../hooks/useRssFeed';

const RssFeedContext = createContext();

export const RssFeedProvider = ({ children }) => {
  const rssFeedState = useRssFeed();

  return (
    <RssFeedContext.Provider value={rssFeedState}>
      {children}
    </RssFeedContext.Provider>
  );
};

export const useRssFeedContext = () => {
  const context = useContext(RssFeedContext);
  if (context === undefined) {
    throw new Error('useRssFeedContext must be used within a RssFeedProvider');
  }
  return context;
}; 