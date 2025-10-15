import { useState, useMemo } from 'react';
import styles from './Availability.module.css';
import { useProducts } from '../../context/ProductContext';
import { ActionMenu } from '../../components/ActionMenu';
import { exportToExcel } from '../../utils/exportToExcel';

export function Availability() {
  // Obtém as listas do nosso contexto global
  const { locations, masterLocations, removeMasterLocation } = useProducts();
  
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
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {availabilityData.map(({ location, status }) => {
              const menuOptions = [
                { label: 'Excluir', onClick: () => handleDeleteMasterLocation(location) },
              ];

              return (
                <tr key={location}>
                  <td>{location}</td>
                  <td>
                    <span className={status === 'Ocupado' ? styles.statusOccupied : styles.statusFree}>
                      {status}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <ActionMenu options={menuOptions} />
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

