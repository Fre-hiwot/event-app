"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();

  let links = [];

  // 🔥 Define links per page
  if (pathname === "/") {
    links = [
      { href: "/auth/login", label: "Login" },
      { href: "/auth/signup", label: "Sign Up" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ];
  } else if (pathname === "/about") {
    links = [
      { href: "/", label: "Home" },
      { href: "/contact", label: "Contact" },
    ];
  } else if (pathname === "/contact") {
    links = [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
    ];
  } else {
    // default (optional)
    links = [
      { href: "/", label: "Home" },
    ];
  }

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <h1 className={styles.logo}>Event App 🎉</h1>

        <div className={styles.navLinks}>
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}