import { useState, useMemo, useEffect, useContext } from 'react';
import styles from './Availability.module.css';
import { useProducts } from '../../context/ProductContext';
import { ActionMenu } from '../../components/ActionMenu';
import { exportToExcel } from '../../utils/exportToExcel';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { AxiosError } from 'axios';

export function Availability() {
  // Obtém as listas do nosso contexto global
  const { locations, masterLocations, removeMasterLocation } = useProducts();
  const { user } = useContext(AuthContext)
  const [searchQuery, setSearchQuery] = useState('');

  // Cria um conjunto (Set) das localizações ocupadas para uma verificação rápida e eficiente
  const occupiedLocations = useMemo(() => new Set(locations.map(loc => loc.location)), [locations]);

  const availabilityData = useMemo(() => {
    return masterLocations
      .filter(locationName =>
        locationName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(locationName => ({
        location: locationName,
        status: occupiedLocations.has(locationName) ? 'Ocupado' : 'Livre',
      }));
  }, [masterLocations, occupiedLocations, searchQuery]);

  const handleExport = () => {
    exportToExcel(availabilityData, 'disponibilidade_localizacao');
  };

  // Função de exclusão com a nova regra de segurança
  const handleDeleteMasterLocation = (locationName: string) => {
    // 1. Verifica se a localização está ocupada ANTES de fazer qualquer coisa
    if (occupiedLocations.has(locationName)) {
      alert(`Não é possível excluir a localização "${locationName}" porque ela está ocupada. Por favor, crie uma saída para os produtos nela primeiro.`);
      return; // Interrompe a função aqui
    }

    // 2. Se a localização estiver livre, pede a confirmação do utilizador
    if (confirm(`Tem a certeza de que deseja excluir permanentemente a localização "${locationName}" do sistema?`)) {
      removeMasterLocation(locationName);
    }
  };

  const handleRequestMasterLocationDeletion = async (locationName: string) => {
    // Usuário não pode solicitar exclusão de local ocupado
    if (occupiedLocations.has(locationName.toLowerCase())) {
      alert(`Não é possível solicitar a exclusão da localização "${locationName}" porque ela está ocupada.`);
      return;
    }

    if (window.confirm(`Deseja solicitar ao administrador a exclusão da localização "${locationName}"?`)) {
      try {
        await api.post(`/master-location/request-deletion/${encodeURIComponent(locationName)}`); 
        alert('Solicitação de exclusão enviada para o administrador.');
        // Opcional: Adicionar feedback visual na linha da tabela
      } catch (error) {
        console.error("Erro ao solicitar exclusão de local mestre:", error);
        if (error instanceof AxiosError && error.response?.data?.error) {
          alert(`Erro: ${error.response.data.error}`);
        } else {
          alert('Não foi possível enviar a solicitação.');
        }
      }
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerActions}>
        <input
          type="text"
          placeholder="Pesquisar por localização..."
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
              <th>Localização</th>
              <th>Disponibilidade</th>
              {/* Mantém o cabeçalho "Ações" visível para todos */}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {availabilityData.map(({ location, status }) => {
              // --- LÓGICA DO MENU ATUALIZADA ---
              const menuOptions = [];
              if (user?.role === 'ADMIN') {
                menuOptions.push({
                  label: 'Excluir',
                  onClick: () => handleDeleteMasterLocation(location)
                });
              } else if (user?.role === 'USUARIO') {
                menuOptions.push({
                  label: 'Solicitar Exclusão',
                  onClick: () => handleRequestMasterLocationDeletion(location)
                });
              }
              // --- FIM DA LÓGICA DO MENU ---

              return (
                <tr key={location}>
                  <td>{location}</td>
                  <td>
                    <span className={status === 'Ocupado' ? styles.statusOccupied : styles.statusFree}>
                      {status}
                    </span>
                  </td>
                  {/* Mantém a célula "Ações" visível para todos */}
                  <td className={styles.actionsCell}>
                    {/* Renderiza o menu SE houver opções (ADMIN ou USUARIO) */}
                    {menuOptions.length > 0 && <ActionMenu options={menuOptions} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}