import React from 'react';
import styles from './Pagination.module.css';

// Define as propriedades (props) que o componente espera receber
type PaginationProps = {
  currentPage: number; // A página que está ativa no momento
  totalPages: number;  // O número total de páginas existentes
  onPageChange: (page: number) => void; // Função para ser chamada quando o usuário clica para mudar de página
};

/**
 * Componente de Paginação reutilizável que renderiza botões de "Anterior" e "Próxima"
 * e exibe a contagem de páginas.
 */
export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Se houver 1 página ou menos, o componente não precisa ser exibido.
  if (totalPages <= 1) {
    return null;
  }

  // Função para navegar para a página anterior
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  // Função para navegar para a próxima página
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={styles.paginationContainer}>
      <button 
        onClick={handlePrevious} 
        disabled={currentPage === 1} 
        className={styles.button}
      >
        Anterior
      </button>

      <span className={styles.pageInfo}>
        Página {currentPage} de {totalPages}
      </span>

      <button 
        onClick={handleNext} 
        disabled={currentPage === totalPages} 
        className={styles.button}
      >
        Próxima
      </button>
    </div>
  );
}

