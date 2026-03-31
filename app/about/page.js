import styles from "./about.module.css";

export default function About() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>About Event App 🎉</h1>

      <p className={styles.text}>
        Event App is a modern platform designed to help users discover,
        explore, and book amazing events بسهولة. Whether you're looking for
        concerts, tech conferences, or cultural experiences, we’ve got you
        covered.
      </p>

      <section className={styles.section}>
        <h2>Our Mission</h2>
        <p>
          Our mission is to connect people with unforgettable experiences by
          making event discovery simple, fast, and accessible.
        </p>
      </section>

      <section className={styles.section}>
        <h2>What We Offer</h2>
        <ul>
          <li>🎟 Easy event booking</li>
          <li>📍 Location-based event discovery</li>
          <li>📅 Real-time event updates</li>
          <li>👤 Personalized user experience</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Who We Are</h2>
        <p>
          We are a passionate team of developers building scalable and secure
          systems using modern technologies like Next.js and Supabase.
        </p>
      </section>
    </div>
  );
}