import styles from "./contact.module.css";

export default function Contact() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Contact Us</h1>

      <p className={styles.text}>
        Have questions or feedback? We'd love to hear from you! Fill out the form below or reach us via email or phone.
      </p>

      <section className={styles.section}>
        <h2>Our Contact Info</h2>
        <p>Email: support@eventapp.com</p>
        <p>Phone: +251 912 345 678</p>
        <p>Address: Addis Ababa, Ethiopia</p>
      </section>

      <section className={styles.section}>
        <h2>Send Us a Message</h2>
        <form className={styles.form}>
          <label>
            Name
            <input type="text" placeholder="Your name" required />
          </label>

          <label>
            Email
            <input type="email" placeholder="Your email" required />
          </label>

          <label>
            Message
            <textarea placeholder="Your message" required />
          </label>

          <button type="submit">Send Message</button>
        </form>
      </section>
    </div>
  );
}