export default function Footer() {
  return (
    <footer className="Footer">
      <div className="FooterContent">
        <p className="FooterText">
          &copy; {new Date().getFullYear()} Event App. All rights reserved.
        </p>
        <div className="FooterLinks">
          <a href="mailto:info@eventapp.com" className="FooterLink">
            info@eventapp.com
          </a>
        </div>
      </div>
    </footer>
  );
}