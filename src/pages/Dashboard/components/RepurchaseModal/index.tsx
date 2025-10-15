import React, { useState } from 'react';
import { Modal } from '../../../../components/Modal';
import { Pagination } from '../../../../components/Pagination';
import { exportToExcel } from '../../../../utils/exportToExcel'; // 1. Importa a função de exportar
import { Product } from '../../../../types';
import styles from './RepurchaseModal.module.css';

const ITEMS_PER_PAGE = 9;

type RepurchaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productsToRepurchase: (Product & { currentQuantity: number })[];
};

export function RepurchaseModal({ isOpen, onClose, productsToRepurchase }: RepurchaseModalProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(productsToRepurchase.length / ITEMS_PER_PAGE);
  const currentItems = productsToRepurchase.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 2. Função para preparar os dados e chamar a exportação
  const handleExport = () => {
    const dataToExport = productsToRepurchase.map(item => ({
      'Nome do Produto': item.name,
      'SKU': item.sku,
      'Quantidade Atual': item.currentQuantity,
      'Regra (Minimo)': item.repurchaseRule,
    }));
    exportToExcel(dataToExport, 'produtos_para_recompra');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lista de Produtos para Recompra">
      <div className={styles.container}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome do Item</th>
                <th>SKU</th>
                <th>Qtd. Atual</th>
                <th>Regra (Mín.)</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map(product => (
                  <tr key={product.sku}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td className={styles.lowStock}>{product.currentQuantity}</td>
                    <td>{product.repurchaseRule}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center' }}>Nenhum produto precisa de recompra no momento.</td>
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
        {/* 3. Adiciona o rodapé com o botão de exportação */}
        <footer className={styles.modalFooter}>
          <button className={styles.exportButton} onClick={handleExport}>
            Exportar para Excel
          </button>
        </footer>
      </div>
    </Modal>
  );
}

