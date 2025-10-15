import { useState, useRef, useEffect } from 'react';
import styles from './ActionMenu.module.css';
import { FaEllipsisV } from 'react-icons/fa'; // Ícone de "três pontos"

// Define as opções que o menu pode ter
type MenuOption = {
  label: string;
  onClick: () => void;
};

type ActionMenuProps = {
  options: MenuOption[];
};

export function ActionMenu({ options }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); // Referência para o menu

  // Efeito para fechar o menu se o usuário clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.menuContainer} ref={menuRef}>
      <button className={styles.menuButton} onClick={() => setIsOpen(!isOpen)}>
        <FaEllipsisV /> {/* Usamos um ícone mais comum para menus */}
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <ul>
            {options.map((option, index) => (
              <li
                key={index}
                onClick={() => {
                  option.onClick();
                  setIsOpen(false); // Fecha o menu após clicar
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
