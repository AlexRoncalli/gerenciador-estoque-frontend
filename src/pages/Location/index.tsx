import { useState, useEffect, useMemo, useContext } from 'react';
import styles from "./Location.module.css";
import { AddProductModal } from '../Inventory/components/AddProductModal';
import { HistoryModal } from '../Inventory/components/HistoryModal';
import { Pagination } from '../../components/Pagination';
import { ActionMenu } from '../../components/ActionMenu';
import { exportToExcel } from '../../utils/exportToExcel';
import { useProducts } from '../../context/ProductContext';
import { Product } from '../../types';
import  api  from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { AxiosError } from 'axios';
import { AddLocationModal } from './components/AddLocationModal';
import { CreateExitModal } from './components/CreateExitModal';
import { ProductLocation, ProductExit, Store } from '../../types';


const ITEMS_PER_PAGE = 9;

export function Location() {
  const { locations, setLocations, addMasterLocation, setExits, findProductBySku, setProducts, products } = useProducts();
  const { user } = useContext(AuthContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [locationToEdit, setLocationToEdit] = useState<ProductLocation | null>(null);
  const [locationForExit, setLocationForExit] = useState<ProductLocation | null>(null);

  // Efeito para carregar produtos do backend ao iniciar a página (da versão "antiga")
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await api.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      }
    }
    loadProducts();
  }, [setProducts]);

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

  // Lógica para calcular a quantidade (da versão "nova")
  const productsWithCalculatedQuantity = useMemo(() => {
    if (!locations) return products;
    return products.map(product => {
      const totalQuantity = locations
        .filter(loc => loc.sku === product.sku)
        .reduce((sum, loc) => sum + (loc.volume * (product.unitsPerBox || 1)), 0);
      return { ...product, quantity: totalQuantity };
    });
  }, [products, locations]);

  // Lógica de filtro e paginação
  const filteredLocations = locations.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filteredLocations.length / ITEMS_PER_PAGE);
  const currentItems = filteredLocations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);


  // Função de Adicionar, reconectada à API e com as validações da versão "nova"
  const handleAddProduct = async (newProductData: Omit<Product, 'id' | 'quantity' | 'history'>) => {
    if (!newProductData.sku.trim() || !newProductData.name.trim() || !newProductData.brand.trim()) {
      alert('Erro: SKU, Nome e Marca são obrigatórios.'); return;
    }
    if (products.some(p => p.sku.toLowerCase() === newProductData.sku.toLowerCase())) {
      alert('Erro: O SKU já existe.'); return;
    }
    if (newProductData.costPrice <= 0) {
      alert('Erro: O preço de custo deve ser maior que zero.'); return;
    }

    try {
      const completeProductData = {
        ...newProductData,
        quantity: 0, // Quantidade inicial é sempre 0
        buyedUnits: 0,
        history: { // Inicia o histórico com o melhor preço sendo o preço inicial
          lastEditDate: new Date().toLocaleDateString('pt-BR'),
          previousPrice: newProductData.costPrice,
          bestPrice: newProductData.costPrice,
        }
      };

      const response = await api.post('/product', completeProductData);
      setProducts(current => [response.data, ...current]);
      setIsModalOpen(false);

    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      if (error instanceof AxiosError && error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Erro ao adicionar produto. Verifique os dados.');
      }
    }
  };

  const handleSaveLocation = async (locationData: Omit<ProductLocation, 'id' | 'name'> & { volumeToMove?: number }) => {
    try {
      if (modalMode === 'edit' && locationToEdit && locationData.volumeToMove) {
        // Lógica de MOVIMENTAÇÃO
        const payload = {
          sourceLocationId: locationToEdit.id,
          destinationLocationName: locationData.location,
          volumeToMove: locationData.volumeToMove,
        };
        await api.post('/locations/move', payload);
      } else {
        // Lógica de INCLUSÃO
        const product = findProductBySku(locationData.sku);
        if (!product) {
          alert('Erro: Produto com este SKU não foi encontrado.');
          return;
        }
        const fullLocationData = { ...locationData, name: product.name };
        await api.post('/location', fullLocationData);
        addMasterLocation(fullLocationData.location);
      }
      
      const response = await api.get('/locations');
      setLocations(response.data);
      setIsModalOpen(false);

    } catch (error) {
      console.error("Erro ao salvar localização:", error);
      alert("Falha ao salvar. Verifique os dados.");
    }
  };

  const handleCreateExit = async (exitData: { exitType: 'Expedição' | 'Full', store?: Store, observation?: string, volumeToExit: number }) => {
    if (!locationForExit) return;

    const newExitData: Omit<ProductExit, 'id'> = {
      sku: locationForExit.sku,
      name: locationForExit.name,
      quantity: exitData.volumeToExit * locationForExit.unitsPerBox,
      date: new Date().toLocaleDateString('pt-BR'),
      exitType: exitData.exitType,
      store: exitData.store,
      observation: exitData.observation || '',
    };

    try {
      await api.post('/exit', newExitData);
      
      const newVolume = locationForExit.volume - exitData.volumeToExit;

      if (newVolume > 0) {
        const updatedLocation = { ...locationForExit, volume: newVolume };
        await api.put(`/location/${locationForExit.id}`, updatedLocation);
      } else {
        await api.delete(`/location/${locationForExit.id}`);
      }

      // Recarrega os dados após a operação
      const locationsResponse = await api.get('/locations');
      setLocations(locationsResponse.data);
      // Opcional: recarregar saídas se a página de Saída precisar ser atualizada em tempo real
      // const exitsResponse = await api.get('/exits');
      // setExits(exitsResponse.data);

      setIsExitModalOpen(false);
      setLocationForExit(null);

    } catch (error) {
      console.error("Erro ao criar saída:", error);
      alert("Falha ao registrar a saída.");
    }
  };


  // Função de Editar, reconectada à API e com a lógica de histórico
  const handleEditProduct = async (updatedProductData: Omit<Product, 'quantity'>) => {
    const originalProduct = products.find(p => p.sku === updatedProductData.sku);
    if (!originalProduct) return;

    const finalProductData = {
      ...originalProduct, // Preserva campos não editáveis como 'quantity'
      ...updatedProductData,
      history: {
        lastEditDate: new Date().toLocaleDateString('pt-BR'),
        previousPrice: originalProduct.costPrice,
        bestPrice: Math.min(originalProduct.history?.bestPrice || originalProduct.costPrice, updatedProductData.costPrice),
      },
    };

    try {
      const response = await api.put(`/product/${finalProductData.sku}`, finalProductData);
      setProducts(current =>
        current.map(p => (p.sku === finalProductData.sku ? response.data : p))
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao editar produto:", error);
      alert("Não foi possível editar o produto.");
    }
  };

  // Função de Deletar, já conectada à API
  const handleDeleteProduct = async (skuToDelete: string) => {
    try {
      await api.delete(`/product/${skuToDelete}`);
      setProducts(current => current.filter(product => product.sku !== skuToDelete));
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      alert("Não foi possível deletar o produto.");
    }
  };

  // Funções auxiliares para abrir modais
  const handleExport = () => { exportToExcel(filteredLocations, 'localizacao_produtos'); };

  const openAddModal = (mode: 'add' | 'edit', location?: ProductLocation) => {
    setModalMode(mode);
    setLocationToEdit(location || null);
    setIsModalOpen(true);
  };
  const openCreateExitModal = (location: ProductLocation) => {
    setLocationForExit(location);
    setIsExitModalOpen(true);
  };
  //const openEditModal = (product: Product) => { setModalMode('edit'); setProductToEdit(product); setIsModalOpen(true); };
  //const openCloneModal = (product: Product) => { setModalMode('clone'); setProductToEdit(product); setIsModalOpen(true); };
  //const openHistoryModal = (product: Product) => { setProductForHistory(product); setIsHistoryModalOpen(true); };

  const handleSave = (productData: any) => {
    if (modalMode === 'edit') {
      handleEditProduct(productData);
    } else {
      handleAddProduct(productData);
    }
  };

    return (
    <div className={styles.pageContainer}>
      <header className={styles.headerActions}>
        <input type="text" placeholder="Pesquisar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={styles.searchInput} />
        <div className={styles.buttonGroup}>
          <button className={styles.button} onClick={() => openAddModal('add')}>Incluir no Estoque</button>
          <button className={`${styles.button} ${styles.exportButton}`} onClick={handleExport}>Exportar para Excel</button>
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
                { label: 'Movimentar', onClick: () => openAddModal('edit', item) },
                { label: 'Criar Saída', onClick: () => openCreateExitModal(item) },
              ];
              if (user?.role === 'ADMIN') {
                // Adicionar lógica de deletar localização aqui, se necessário
              }
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

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      <AddLocationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveLocation} mode={modalMode} initialData={locationToEdit} />
      <CreateExitModal isOpen={isExitModalOpen} onClose={() => setIsExitModalOpen(false)} onSave={handleCreateExit} locationData={locationForExit} />
    </div>
  );
}