import { supabase } from "../lib/supabase";

export default async function Home() {
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .limit(3);

  return (
    <main>
      <h1>Welcome to Event App 🎉</h1>

      <a href="/auth/login">Login</a>
      <a href="/auth/signup">Sign Up</a>

      <h2>Featured Events</h2>

      {events?.map((event) => (
        <div key={event.id}>
          <h3>{event.title}</h3>
        </div>
      ))}

      <a href="/events">View All Events</a>
    </main>
  );
}