import { Suspense } from "react";
import AddEventClient from "./AddEventClient";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <AddEventClient />
    </Suspense>
  );
}