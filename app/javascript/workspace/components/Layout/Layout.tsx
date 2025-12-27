import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
