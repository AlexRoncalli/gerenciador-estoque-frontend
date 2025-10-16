import React from 'react';
import styles from './Modal.module.css';
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
    // O 'portal' do modal, que escurece o fundo
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <h2>{title}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <FaTimes />
          </button>
        </header>
        <main className={styles.modalBody}>
          {children}
        </main>
      </div>
    </div>
  );
}