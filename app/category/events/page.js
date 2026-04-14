import { Suspense } from "react";
import CategoryEventsClient from "./CategoryEventsClient";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading events...</p>}>
      <CategoryEventsClient />
    </Suspense>
  );
}