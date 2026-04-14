import { Suspense } from "react";
import BookEventClient from "./BookEventClient";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6">Loading event...</p>}>
      <BookEventClient />
    </Suspense>
  );
}