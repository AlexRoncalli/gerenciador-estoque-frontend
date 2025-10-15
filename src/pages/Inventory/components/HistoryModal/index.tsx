import React from 'react';
import { Modal } from '../../../../components/Modal';
import { Product } from '../../../../types';
import styles from './HistoryModal.module.css';

type HistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
};

export function HistoryModal({ isOpen, onClose, product }: HistoryModalProps) {
  if (!product) return null;

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Histórico: ${product.name}`}>
      <div className={styles.historyContainer}>
        {product.history ? (
          <>
            <div className={styles.historyItem}>
              <strong>Data da Última Edição:</strong>
              <span>{product.history.lastEditDate}</span>
            </div>
            <div className={styles.historyItem}>
              <strong>Preço Anterior:</strong>
              <span>{formatCurrency(product.history.previousPrice)}</span>
            </div>
            <div className={styles.historyItem}>
              <strong>Preço Atual:</strong>
              <span>{formatCurrency(product.costPrice)}</span>
            </div>
            <div className={`${styles.historyItem} ${styles.bestPrice}`}>
              <strong>Melhor Preço Registado:</strong>
              <span>{formatCurrency(product.history.bestPrice)}</span>
            </div>
          </>
        ) : (
          <p>Ainda não há histórico de edições para este produto.</p>
        )}
      </div>
    </Modal>
  );
}

