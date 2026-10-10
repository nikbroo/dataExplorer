import { useState, type ChangeEvent } from "react";
import { Search, X } from "lucide-react";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";

interface SearchInputProps {
  value: string;
  onSearch: (value: string) => void;
  delay?: number;
}

const SearchInput = ({ value, onSearch, delay = 350 }: SearchInputProps) => {
  const [draft, setDraft] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const { debounced, cancel } = useDebouncedCallback(onSearch, delay);

  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
    debounced(event.target.value);
  };

  const handleClear = () => {
    cancel();
    setDraft("");
    onSearch("");
  };

  return (
    <div className="relative w-full sm:max-w-sm">
      <label htmlFor="order-search" className="sr-only">
        Search orders
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
      />
      <input
        id="order-search"
        type="search"
        value={draft}
        onChange={handleChange}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            cancel();
            onSearch(draft);
          }
        }}
        placeholder="Search order #, customer, email, product"
        autoComplete="off"
        className="h-10 w-full rounded-md border border-slate-300 bg-white pr-9 pl-9 text-sm text-slate-900 placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
