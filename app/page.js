import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Welcome to Event App </h1>
          <p className={styles.heroText}>
            Discover amazing events near you. Music, Art, Food, Tech, and more!
          </p>
        </div>
      </section>

      <section className={styles.highlights}>
        <h2 className={styles.sectionTitle}>Our Highlights</h2>
        <div className={styles.highlightGrid}>

          <div className={styles.card}>
            <img src="/images/image1.jpg" alt="Music Festival" className={styles.cardImage}/>
            <h3>Music Festival</h3>
          </div>

          <div className={styles.card}>
            <img src="/images/image2.jpg" alt="Tech Conference" className={styles.cardImage}/>
            <h3>Tech Conference</h3>    
          </div>

          <div className={styles.card}>
            <img src="/images/image3.jpg" alt="Art Exhibition" className={styles.cardImage}/>
            <h3>Art Exhibition</h3>
          </div>

          <div className={styles.card}>
            <img src="/images/image4.jpg" alt="Art Exhibition" className={styles.cardImage}/>
            <h3>Food Festival</h3>
          </div>

          <div className={styles.card}>
            <img src="/images/image5.jpg" alt="Art Exhibition" className={styles.cardImage}/>
            <h3>Charity Gala</h3>
          </div>

          <div className={styles.card}>
            <img src="/images/image6.jpg" alt="Art Exhibition" className={styles.cardImage}/>
            <h3>Jazz Night</h3>
        </div>

         <div className={styles.card}>
            <img src="/images/image6.jpg" alt="Art Exhibition" className={styles.cardImage}/>
            <h3>Photography Showcase</h3>
        </div>

         <div className={styles.card}>
            <img src="/images/image6.jpg" alt="Art Exhibition" className={styles.cardImage}/>
            <h3>Coffee Lovers Meetup</h3>
        </div>

         <div className={styles.card}>
            <img src="/images/image6.jpg" alt="Art Exhibition" className={styles.cardImage}/>
            <h3>Startup Meetup</h3>
        </div>

         <div className={styles.card}>
            <img src="/images/image6.jpg" alt="Art Exhibition" className={styles.cardImage}/>
            <h3>Community Clean-Up</h3>
        </div>

        </div>
      </section>
    </div>
  );
}