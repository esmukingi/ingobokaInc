// components/SearchInput.js
"use client";

import { Search, X } from "lucide-react";
import { useSearch } from "@/context/searchContext";
import { useState, useEffect } from "react";

export default function SearchInput({ placeholder }) {
  // Safely get context
  let searchContext;
  try {
    searchContext = useSearch();
  } catch (error) {
    // If context is not available, render a basic search input
    return (
      <div className="relative w-full md:w-96">
        <input
          type="text"
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 text-sm 
            focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 
            transition-all shadow-sm"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      </div>
    );
  }

  const { searchQuery, handleSearch, clearSearch } = searchContext;
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Update local query when context changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== searchQuery) {
        handleSearch(localQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, searchQuery, handleSearch]);

  const handleClear = () => {
    setLocalQuery("");
    clearSearch();
  };

  return (
    <div className="relative w-full md:w-96">
      <input
        type="text"
        placeholder={placeholder}
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 text-sm 
          focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 
          transition-all shadow-sm"
      />

      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      
      {localQuery && (
        <button
          onClick={handleClear}
          className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}