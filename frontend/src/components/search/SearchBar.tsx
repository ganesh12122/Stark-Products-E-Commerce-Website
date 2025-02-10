import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2 pl-10 pr-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search products..."
        />
        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        <button
          type="submit"
          className="absolute right-2 top-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg z-50">
          {suggestions.map((item: any) => (
            <div key={item.id} className="p-2 hover:bg-gray-100 cursor-pointer">
              {item.name}
            </div>
          ))}
        </div>
      )}
    </form>
  );
};

export default SearchBar; 