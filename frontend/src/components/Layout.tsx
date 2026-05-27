import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import ProfileAvatarReminder from './ProfileAvatarReminder';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-dark">
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo
      </a>
      <Header />
      <ProfileAvatarReminder />
      <main id="main-content" className="flex-grow" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
