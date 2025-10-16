import React from 'react';
import styles from './Modal.module.css';
import Draggable from 'react-draggable';
import { FaTimes } from 'react-icons/fa';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode; // 'children' permite colocar qualquer conteúdo dentro do modal
};

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Se o modal não estiver aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (event: React.MouseEvent) => {
    // A mágica está aqui:
    // Se o alvo do clique (event.target) for o mesmo que o elemento
    // que tem o listener (event.currentTarget), significa que o clique
    // foi no fundo, e não no conteúdo do modal.
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      {/* 2. Envolva o conteúdo do modal com o componente Draggable */}
      <Draggable handle={`.${styles.modalHeader}`}>
        <div className={styles.modalContent} style={{ cursor: 'move' }}> {/* Adicionado cursor para feedback visual */}
          {/* 3. O 'handle' acima usa a classe do header para definir a área de arrasto */}
          <header className={styles.modalHeader}>
            <h2>{title}</h2>
            <button onClick={onClose} className={styles.closeButton}>
              X
              <FaTimes />{/*não sei oq isso faz ver com juru*/}
            </button>
          </header>
          <main style={{ cursor: 'default' }}> {/* Restaura o cursor padrão para o conteúdo */}
            {children}
          </main>
        </div>
      </Draggable>
    </div>
  );
}