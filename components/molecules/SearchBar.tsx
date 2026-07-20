"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for anything..."
        className="border-border flex-1 rounded-md border px-3 py-2.5 text-base"
      />
      <button
        type="submit"
        className="bg-primary text-primary-foreground rounded-md px-4 py-2.5 text-sm font-medium"
      >
        Search
      </button>
    </form>
  );
}
