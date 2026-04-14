'use client';

import { useSearchParams } from "next/navigation";

export default function SearchParamsClient({ children }) {
  const searchParams = useSearchParams();

  return children(searchParams);
}