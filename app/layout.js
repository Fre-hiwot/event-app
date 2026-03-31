import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function RootLayout({ children }) {
  return (
    <html >
      <body className="AppBody">
        <Navbar />
        <main className="AppMain">{children}</main>
        <Footer />
      </body>
    </html>
  );
}