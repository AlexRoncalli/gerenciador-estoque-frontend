import { useState, useEffect, useContext } from 'react';
import styles from "./Location.module.css";
import { Pagination } from '../../components/Pagination';
import { ActionMenu } from '../../components/ActionMenu';
import { AddLocationModal } from './components/AddLocationModal';
import { CreateExitModal } from './components/CreateExitModal';
import { ProductLocation, ProductExit, Store } from '../../types';
import { exportToExcel } from '../../utils/exportToExcel';
import { useProducts } from '../../context/ProductContext';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const ITEMS_PER_PAGE = 12;

export function Location() {
  const { locations, setLocations, addMasterLocation, setExits, findProductBySku } = useProducts();
  const { user } = useContext(AuthContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [locationToEdit, setLocationToEdit] = useState<ProductLocation | null>(null);
  const [locationToExit, setLocationToExit] = useState<ProductLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);// evitar multiplos clicks fazendo varias adições

  // Carrega localizações do backend ao iniciar
  useEffect(() => {
    async function loadLocations() {
      try {
        const response = await api.get('/locations');
        setLocations(response.data);
      } catch (error) {
        console.error("Erro ao buscar localizações:", error);
      }
    }
    loadLocations();
  }, [setLocations]);

  // Filtro e paginação
  const filteredLocations = locations.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLocations.length / ITEMS_PER_PAGE);
  const currentItems = filteredLocations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const handleExport = () => { exportToExcel(filteredLocations, 'localizacao_produtos'); };

  const openAddModal = () => {
    setModalMode('add');
    setLocationToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (location: ProductLocation) => {
    setModalMode('edit');
    setLocationToEdit(location);
    setIsModalOpen(true);
  };

  const openCreateExitModal = (location: ProductLocation) => {
    setLocationToExit(location);
    setIsExitModalOpen(true);
  };

  // LÓGICA PRINCIPAL: Faz recálculo local e sincroniza com backend
  const handleSaveLocation = async (locationData: Omit<ProductLocation, 'id' | 'name'> & { volumeToMove?: number }) => {
    const product = findProductBySku(locationData.sku);
    if (!product) {
      alert('Erro: Produto com este SKU não foi encontrado.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (modalMode === 'edit') {
        // ===== MOVIMENTAÇÃO =====
        if (!locationToEdit || !locationData.volumeToMove) return;

        // 1. Calcula novo estado local (seguindo lógica original)
        const locationsAfterRemoval = locations.map(loc => {
          if (loc.sku === locationToEdit.sku &&
            loc.location === locationToEdit.location &&
            loc.unitsPerBox === locationToEdit.unitsPerBox) {
            return { ...loc, volume: loc.volume - locationData.volumeToMove! };
          }
          return loc;
        });

        const destinationIndex = locationsAfterRemoval.findIndex(loc =>
          loc.sku === locationToEdit.sku &&
          loc.location === locationData.location &&
          loc.unitsPerBox === locationToEdit.unitsPerBox
        );

        let finalLocations;
        if (destinationIndex > -1) {
          // Destino existe, soma o volume
          finalLocations = locationsAfterRemoval.map((loc, index) => {
            if (index === destinationIndex) {
              return { ...loc, volume: loc.volume + locationData.volumeToMove! };
            }
            return loc;
          });
        } else {
          // Destino não existe, cria novo lote
          finalLocations = [
            ...locationsAfterRemoval,
            {
              ...locationToEdit,
              location: locationData.location,
              volume: locationData.volumeToMove,
              date: new Date().toLocaleDateString('pt-BR')
            }
          ];
        }

        // Remove lotes com volume zero
        finalLocations = finalLocations.filter(loc => loc.volume > 0);

        // 2. Sincroniza com backend
        // Atualiza origem
        const originAfterMove = finalLocations.find(loc =>
          loc.sku === locationToEdit.sku &&
          loc.location === locationToEdit.location &&
          loc.unitsPerBox === locationToEdit.unitsPerBox
        );

        if (originAfterMove) {
          // Origem ainda tem volume, atualiza
          await api.put(`/location/${locationToEdit.id}`, originAfterMove);
        } else {
          // Origem zerou, deleta
          await api.delete(`/location/${locationToEdit.id}`);
        }

        // Atualiza ou cria destino
        const destinationAfterMove = finalLocations.find(loc =>
          loc.sku === locationToEdit.sku &&
          loc.location === locationData.location &&
          loc.unitsPerBox === locationToEdit.unitsPerBox
        );

        if (destinationAfterMove) {
          if (destinationAfterMove.id) {
            // Destino já existia, atualiza
            await api.put(`/location/${destinationAfterMove.id}`, destinationAfterMove);
          } else {
            // Destino é novo, cria
            const fullLocationData = {
              ...destinationAfterMove,
              name: product.name
            };
            await api.post('/location', fullLocationData);
          }
        }

        addMasterLocation(locationData.location);

      } else {
        // ===== INCLUSÃO =====

        // NOVA VALIDAÇÃO 
        // Verifica se a localização já está ocupada por um SKU diferente.
        const occupiedLocation = locations.find(loc => loc.location.toLowerCase() === locationData.location.toLowerCase());

        if (occupiedLocation && occupiedLocation.sku.toLowerCase() !== locationData.sku.toLowerCase()) {
          alert(`Erro: A localização "${locationData.location}" já está ocupada pelo produto SKU: ${occupiedLocation.sku}.\nUma localização só pode conter um tipo de produto.`);
          return; // Impede o salvamento
        }
        // ===== INCLUSÃO =====
        // 1. Verifica se já existe lote compatível localmente
        const existingEntryIndex = locations.findIndex(loc =>
          loc.sku === locationData.sku &&
          loc.location === locationData.location &&
          loc.unitsPerBox === locationData.unitsPerBox
        );

        if (existingEntryIndex > -1) {
          // Lote compatível encontrado, atualiza somando o volume
          const existingEntry = locations[existingEntryIndex];
          const updatedEntry = {
            ...existingEntry,
            volume: existingEntry.volume + locationData.volume
          };

          await api.put(`/location/${existingEntry.id}`, updatedEntry);

        } else {
          // Novo lote, cria entrada
          const fullLocationData: ProductLocation = {
            ...locationData,
            name: product.name,
            date: new Date().toLocaleDateString('pt-BR'),
            id: ''
          };

          await api.post('/location', fullLocationData);
        }

        addMasterLocation(locationData.location);
      }

      // 3. Recarrega todas as localizações do backend
      const response = await api.get('/locations');
      setLocations(response.data);
      setIsModalOpen(false);

    } catch (error) {
      console.error("Erro ao salvar localização:", error);
      alert("Falha ao salvar. Verifique os dados e tente novamente.");
    } finally {
      // Desativa o estado de carregamento, ocorrendo erro ou não
      setIsSubmitting(false);
    }
  };

  // CRIAR SAÍDA: Remove do estoque e registra a saída
  const handleCreateExit = async (exitData: {
    exitType: 'Expedição' | 'Full',
    store?: Store,
    observation?: string,
    volumeToExit: number
  }) => {
    if (!locationToExit) return;

    const newExitData: Omit<ProductExit, 'id'> = {
      sku: locationToExit.sku,
      name: locationToExit.name,
      quantity: exitData.volumeToExit * locationToExit.unitsPerBox,
      date: new Date().toLocaleDateString('pt-BR'),
      exitType: exitData.exitType,
      store: exitData.store,
      observation: exitData.observation || '',
    };

    try {
      setIsSubmitting(true);
      // 1. Registra a saída
      await api.post('/exit', newExitData);

      // 2. Atualiza ou remove a localização
      const newVolume = locationToExit.volume - exitData.volumeToExit;

      if (newVolume > 0) {
        const updatedLocation = {
          ...locationToExit,
          volume: newVolume
        };
        await api.put(`/location/${locationToExit.id}`, updatedLocation);
      } else {
        // Volume chegou a zero, remove o lote
        await api.delete(`/location/${locationToExit.id}`);
      }

      // 3. Recarrega os dados
      const locationsResponse = await api.get('/locations');
      setLocations(locationsResponse.data);

      setIsExitModalOpen(false);
      setLocationToExit(null);

    } catch (error) {
      console.error("Erro ao criar saída:", error);
      alert("Falha ao registrar a saída. Tente novamente.");
    } finally {
      // Desativa o estado de carregamento, ocorrendo erro ou não
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerActions}>
        <input
          type="text"
          placeholder="Pesquisar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.buttonGroup}>
          <button className={styles.button} onClick={openAddModal}>
            Incluir no Estoque
          </button>
          <button className={`${styles.button} ${styles.exportButton}`} onClick={handleExport}>
            Exportar para Excel
          </button>
        </div>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome do Produto</th>
              <th>SKU</th>
              <th>Localização</th>
              <th>Unidades p/ Caixa</th>
              <th>Nº de Caixas (Volume)</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item) => {
              const menuOptions = [
                { label: 'Movimentar', onClick: () => openEditModal(item) },
                { label: 'Criar Saída', onClick: () => openCreateExitModal(item) },
              ];

              return (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.location}</td>
                  <td>{item.unitsPerBox}</td>
                  <td>{item.volume}</td>
                  <td>{item.date}</td>
                  <td className={styles.actionsCell}>
                    <ActionMenu options={menuOptions} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <AddLocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLocation}
        mode={modalMode}
        initialData={locationToEdit}
        isSubmitting={isSubmitting}
      />

      <CreateExitModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onSave={handleCreateExit}
        locationData={locationToExit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}