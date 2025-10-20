import React, { useState } from 'react';
import { Modal } from '../../../../components/Modal';
import { Pagination } from '../../../../components/Pagination';
import { exportToExcel } from '../../../../utils/exportToExcel';
import { Product } from '../../../../types';
import styles from './RepurchaseModal.module.css';

const ITEMS_PER_PAGE = 9;

// O tipo de dados foi atualizado para incluir a 'suggestion'
type RepurchaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productsToRepurchase: (Product & { currentQuantity: number; suggestion: number })[];
};

export function RepurchaseModal({ isOpen, onClose, productsToRepurchase }: RepurchaseModalProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(productsToRepurchase.length / ITEMS_PER_PAGE);
  const currentItems = productsToRepurchase.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleExport = () => {
    // Adiciona a nova coluna aos dados de exportação
    const dataToExport = productsToRepurchase.map(item => ({
      'Nome do Produto': item.name,
      'SKU': item.sku,
      'Quantidade Atual': item.currentQuantity,
      'Regra (Minimo)': item.repurchaseRule,
      'Sugestão de Recompra': item.suggestion,
    }));
    exportToExcel(dataToExport, 'produtos_para_recompra');
  };

  return (
    // contentClassName is used, as in both versions
    <Modal isOpen={isOpen} onClose={onClose} title="Lista de Produtos para Recompra" contentClassName={styles.wideModal}>
      <div className={styles.container}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome do Item</th>
                <th>SKU</th>
                <th>Origem (Fornecedor)</th> {/* Added column header from version 2 */}
                <th>Qtd. Atual</th>
                <th>Regra (Mín.)</th>
                <th>Sugestão de Recompra</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map(product => (
                  <tr key={product.sku}>
                    {/* Corrected column mapping (name first) from version 2 */}
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.supplier || '-'}</td> {/* Added supplier data from version 2 */}
                    <td className={styles.lowStock}>{product.currentQuantity}</td>
                    <td>{product.repurchaseRule}</td>
                    <td className={styles.suggestion}>{product.suggestion}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  {/* Updated colSpan to 6 from version 2 */}
                  <td colSpan={6} style={{ textAlign: 'center' }}>Nenhum produto precisa de recompra no momento.</td>
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
