// src/components/SearchComponent.tsx
'use client'
import { useState,useEffect } from 'react';

interface SearchComponentProps {
  onSearch: (query: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({ onSearch, searchTerm, setSearchTerm }) => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm); 
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);


  useEffect(() => {
    const throttledSearch = setTimeout(() => {
      onSearch(debouncedSearchTerm);
    }, 500);

    return () => {
      clearTimeout(throttledSearch); 
    };
  }, [debouncedSearchTerm, onSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value); // Trigger search when the input changes
  };

  return (
    <input
      type="text"
      placeholder="Search"
      value={searchTerm}
      onChange={handleSearchChange}
      className="w-full p-2 mb-4 border border-gray-300 rounded-md"
    />
  );
};

export default SearchComponent;
