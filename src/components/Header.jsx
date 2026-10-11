export default function Header() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a href="#" className="logo">
          <svg className="logo-mark" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="7" y="5" width="18" height="22" rx="2" fill="#fff" stroke="currentColor" strokeWidth="1.6" />
            <path d="M11 11h10M11 15h10M11 19h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path
              className="logo-ring"
              d="M4 17c0-7 6-12 13-12s11 5 11 11-6 12-13 12C9 28 4.5 24 4 17"
              fill="none"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          Resume Builder
        </a>
        <nav className="nav-links">
          <a href="#how">How it works</a>
        </nav>
      </div>
    </header>
  );
}
