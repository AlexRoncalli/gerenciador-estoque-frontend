import { Outlet } from 'react-router-dom';
import { Sidebar } from '../sidebar/Sidebar';
import styles from './layout.module.css';

export function Layout() {
  return (
    <div className={styles.layoutContainer}>
      <Sidebar />
      <main className={styles.content}>
        {/* O Outlet é onde as páginas (Home, Dashboard, etc.) serão renderizadas */}
        <Outlet />
      </main>
    </div>
  );
}