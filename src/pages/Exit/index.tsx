import { useState, useEffect, useContext } from 'react';
import styles from './Exit.module.css';
import { useProducts } from '../../context/ProductContext';
import { ActionMenu } from '../../components/ActionMenu';
import { EditObservationModal } from '../../components/EditObservationModal/EditObservationModal';
import { exportToExcel } from '../../utils/exportToExcel';
import api from '../../services/api';
import { ProductExit } from '../../types';
import { AuthContext } from '../../context/AuthContext';
import { AxiosError } from 'axios';

export function Exit() {
  const { exits, setExits } = useProducts();
  const { user } = useContext(AuthContext);

  // 2. DECLARAÇÃO DO ESTADO 'filteredExits' ADICIONADA
  const [filteredExits, setFilteredExits] = useState<ProductExit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para o novo modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [exitToEdit, setExitToEdit] = useState<ProductExit | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

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
      (item.store ?? '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.observation ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredExits(result);
  }, [searchQuery, exits]);


  const handleExport = () => {
    // Ajuste para usar os dados filtrados e formatados corretamente
    const dataToExport = filteredExits.map(item => ({
        'Produto': item.name,
        'SKU': item.sku,
        'Quantidade': item.quantity,
        'Data': item.date,
        'Tipo de Saída': item.exitType,
        'Loja': item.store || '-',
        'Observação': item.observation || '-'
    }));
    exportToExcel(dataToExport, 'registo_de_saidas');
  };

  // Esta função será chamada pelo USUARIO
  const handleRequestExport = async () => {
    if (!window.confirm("Você deseja solicitar a um administrador a exportação deste relatório?")) {
      return;
    }
    try {
      // Usaremos o AuditLog por enquanto, mas o ideal é um novo sistema de "ExportRequest"
      await api.post('/admin/audit-log', {
        actionType: "SOLICITAR_EXPORTACAO",
        details: "Usuário solicitou a exportação do relatório de Saídas."
      });
      alert("Solicitação enviada. Um administrador será notificado para liberar o arquivo para você.");
    } catch (error) {
      console.error("Erro ao solicitar exportação:", error);
      alert("Não foi possível enviar sua solicitação.");
    }
  };

  const openEditModal = (exitItem: ProductExit) => {
    setExitToEdit(exitItem);
    setIsEditModalOpen(true);
  };

  const handleUpdateObservation = async (newObservation: string) => {
    if (!exitToEdit) return;
    try {
      setIsSubmitting(true);
      const response = await api.put(`/exit/${exitToEdit.id}/observation`, { observation: newObservation });

      setExits(currentExits =>
        currentExits.map(exit => exit.id === exitToEdit.id ? response.data : exit)
      );
      setIsEditModalOpen(false);
      setExitToEdit(null);
    } catch (error) {
      console.error("Erro ao atualizar observação:", error);
      alert("Falha ao atualizar a observação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExit = async (exitId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro de saída? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      await api.delete(`/exit/${exitId}`);
      setExits(current => current.filter(exit => exit.id !== exitId));
    } catch (error) {
      console.error("Erro ao excluir saída:", error);
      alert("Falha ao excluir o registro de saída.");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerActions}>
        <input
          type="text"
          // Placeholder atualizado da Versão 2
          placeholder="Pesquisar por produto, SKU, loja ou observação..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.buttonGroup}>
          {/* Lógica do botão condicional mantida da Versão 1 */}
          <button
            className={`${styles.button} ${styles.exportButton}`}
            onClick={user?.role === 'ADMIN' || 'USUARIO' ? handleExport : handleRequestExport}
          >
            {user?.role === 'ADMIN' ? 'Exportar para Excel' : 'Solicitar Exportação'}
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
              {/* Coluna Ações condicional mantida da Versão 1 */}
              {user?.role === 'ADMIN' && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {filteredExits.map((item) => {
              // Lógica do menuOptions mantida da Versão 1
              const menuOptions = [];
              if (user?.role === 'ADMIN') {
                menuOptions.push(
                  { label: 'Editar Observação', onClick: () => openEditModal(item) },
                  { label: 'Excluir Saída', onClick: () => handleDeleteExit(item.id) }
                );
              }

              return (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.quantity}</td>
                  <td>{item.date}</td>
                  <td><span className={item.exitType === 'Expedição' ? styles.tagExpedicao : styles.tagFull}>{item.exitType}</span></td>
                  <td>{item.store || '-'}</td>
                  <td>{item.observation || '-'}</td>
                  {/* Célula Ações condicional mantida da Versão 1 */}
                  {user?.role === 'ADMIN' && (
                    <td className={styles.actionsCell}>
                      {menuOptions.length > 0 && <ActionMenu options={menuOptions} />}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal mantido da Versão 1 */}
      <EditObservationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateObservation}
        initialObservation={exitToEdit?.observation || ''}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}