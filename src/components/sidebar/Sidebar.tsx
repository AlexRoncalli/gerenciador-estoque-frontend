import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { FaHome, FaTachometerAlt, FaBoxOpen, FaMapMarkerAlt, FaCheckCircle, FaSignOutAlt, FaTasks } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import { FaUsersCog } from 'react-icons/fa';
import { FaHistory } from 'react-icons/fa'; // Pode usar outro ícone se preferir



// substituir 'KUAILE BIJUX' por um arquivo de logo posteriormente
const logoText = "KUAILE BIJUX";

export function Sidebar() {
  const { user } = useContext(AuthContext);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        {logoText}
      </div>
      <nav className={styles.navigation}>
        <p className={styles.menuTitle}>MENU</p>
        <NavLink to="/" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          <FaHome /> <span>Home</span>
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          <FaTachometerAlt /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/estoque" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          <FaBoxOpen /> <span>Estoque</span>
        </NavLink>
        <NavLink to="/localizacao" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          <FaMapMarkerAlt /> <span>Localização</span>
        </NavLink>
        <NavLink to="/disponibilidade" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          <FaCheckCircle /> <span>Disponibilidade</span>
        </NavLink>
        <NavLink to="/saida" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          <FaSignOutAlt /> <span>Saída</span>
        </NavLink>
      </nav>

      {/* Ele só renderiza a seção de Admin se o usuário tiver a role 'ADMIN' */}
      {user?.role === 'ADMIN' && (
        <nav className={styles.navigation}>
          <p className={styles.menuTitle}>ADMINISTRAÇÃO</p>
          <NavLink to="/admin/solicitacoes" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
            <FaTasks /> <span>Solicitações</span>
          </NavLink>
          <NavLink to="/admin/usuarios" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
            <FaUsersCog /> <span>Usuários</span>
          </NavLink>
          <NavLink to="/admin/logs" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
            <FaHistory /> <span>Logs de Auditoria</span>
          </NavLink>
        </nav>
      )}

    </aside>
  );
}