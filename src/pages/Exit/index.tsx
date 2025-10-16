import { useState, useEffect } from 'react';
import styles from './Exit.module.css';
import { useProducts } from '../../context/ProductContext';
import { ActionMenu } from '../../components/ActionMenu';
import { EditObservationModal } from '../../components/EditObservationModal/EditObservationModal';
import { exportToExcel } from '../../utils/exportToExcel';
import api from '../../services/api'; 
import { ProductExit } from '../../types';

export function Exit() {
  const { exits, setExits } = useProducts();

  // 2. DECLARAÇÃO DO ESTADO 'filteredExits' ADICIONADA
  const [filteredExits, setFilteredExits] = useState<ProductExit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para o novo modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [exitToEdit, setExitToEdit] = useState<ProductExit | null>(null);


  useEffect(() => {
    async function loadExits() {
      try {
        const response = await api.get('/exits');
        setExits(response.data);
      } catch (error) {
        console.error("Erro ao buscar registros de saída:", error);
      }
    }
    loadExits();
  }, [setExits]);

  useEffect(() => {
    const result = exits.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.observation ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredExits(result);
  }, [searchQuery, exits]);


  const handleExport = () => {
    exportToExcel(filteredExits, 'registo_de_saidas');
  };

  const openEditModal = (exitItem: ProductExit) => {
    setExitToEdit(exitItem);
    setIsEditModalOpen(true);
  };

  const handleUpdateObservation = async (newObservation: string) => {
    if (!exitToEdit) return;
    try {
      const response = await api.put(`/exit/${exitToEdit.id}/observation`, { observation: newObservation });
      // Atualiza a lista na tela com o item modificado
      setExits(currentExits =>
        currentExits.map(exit => exit.id === exitToEdit.id ? response.data : exit)
      );
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar observação:", error);
      alert("Falha ao atualizar a observação.");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerActions}>
        <input
          type="text"
          placeholder="Pesquisar por produto, SKU ou observação..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.buttonGroup}>
          <button className={`${styles.button} ${styles.exportButton}`} onClick={handleExport}>
            Exportar para Excel
          </button>
        </div>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Produto</th>
              <th>SKU</th>
              <th>Quantidade</th>
              <th>Data</th>
              <th>Tipo de Saída</th>
              <th>Loja</th>
              <th>Observação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredExits.map((item) => {
              const menuOptions = [
                { label: 'Editar Observação', onClick: () => alert(`Lógica para editar a observação do item ${item.sku} ainda por implementar.`) },
              ];

              return (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.quantity}</td>
                  <td>{item.date}</td>
                  <td><span className={item.exitType === 'Expedição' ? styles.tagExpedicao : styles.tagFull}>{item.exitType}</span></td>
                  <td>{item.store || '-'}</td>
                  <td>{item.observation || '-'}</td>
                  <td className={styles.actionsCell}>
                    <ActionMenu options={menuOptions} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EditObservationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateObservation}
        initialObservation={exitToEdit?.observation || ''}
      />
    </div>
  );
}