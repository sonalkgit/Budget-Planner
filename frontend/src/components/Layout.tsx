import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>Smart Budget</Link>
        <nav className={styles.nav}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}>
            Dashboard
          </NavLink>
          <NavLink to="/transactions" className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}>
            Transactions
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}>
            Profile
          </NavLink>
        </nav>
        <div className={styles.user}>
          <span className={styles.email}>{user?.email}</span>
          <button type="button" onClick={handleLogout} className={styles.logout}>
            Logout
          </button>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
