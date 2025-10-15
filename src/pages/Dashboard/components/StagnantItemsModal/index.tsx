import React, { useState } from 'react';
import { Modal } from '../../../../components/Modal';
import { Pagination } from '../../../../components/Pagination';
import { exportToExcel } from '../../../../utils/exportToExcel';
import styles from './StagnantItemsModal.module.css';

// O tipo de dados que este modal espera receber
type StagnantItem = {
  sku: string;
  name: string;
  currentQuantity: number;
  daysSinceLastMovement: number;
};

type StagnantItemsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  stagnantItems: StagnantItem[];
};

const ITEMS_PER_PAGE = 9;

export function StagnantItemsModal({ isOpen, onClose, stagnantItems }: StagnantItemsModalProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(stagnantItems.length / ITEMS_PER_PAGE);
  const currentItems = stagnantItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const handleExport = () => {
    // Prepara os dados para exportação, removendo o nome interno da propriedade
    const dataToExport = stagnantItems.map(item => ({
      'Nome do Produto': item.name,
      'SKU': item.sku,
      'Quantidade Atual': item.currentQuantity,
      'Dias Sem Saida': item.daysSinceLastMovement,
    }));
    exportToExcel(dataToExport, 'itens_sem_saida');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lista de Itens Sem Saída (> 30 dias)">
      <div className={styles.container}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome do Item</th>
                <th>SKU</th>
                <th>Qtd. Atual</th>
                <th>Dias Sem Saída</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map(item => (
                  <tr key={item.sku}>
                    <td>{item.name}</td>
                    <td>{item.sku}</td>
                    <td>{item.currentQuantity}</td>
                    <td className={styles.stagnantDays}>{item.daysSinceLastMovement}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center' }}>Nenhum item sem saída no momento.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
        <footer className={styles.modalFooter}>
          <button className={styles.exportButton} onClick={handleExport}>
            Exportar para Excel
          </button>
        </footer>
      </div>
    </Modal>
  );
}
