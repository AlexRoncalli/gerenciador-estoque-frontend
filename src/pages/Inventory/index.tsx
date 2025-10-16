import { useState, useEffect, useMemo, useContext } from 'react';
import styles from './Inventory.module.css';
import { AddProductModal } from './components/AddProductModal';
import { HistoryModal } from './components/HistoryModal/index';
import { Pagination } from '../../components/Pagination';
import { ActionMenu } from '../../components/ActionMenu';
import { exportToExcel } from '../../utils/exportToExcel';
import { useProducts } from '../../context/ProductContext';
import { Product } from '../../types';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { AxiosError } from 'axios';

const ITEMS_PER_PAGE = 12;

export function Inventory() {
  const { products, setProducts, locations } = useProducts();
  const { user } = useContext(AuthContext);

  // Estados locais da página (modais, paginação, busca)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'clone'>('add');
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productForHistory, setProductForHistory] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); //isso aqui vai resolver o erro de adicionar varias vezes

  // Efeito para carregar produtos do backend ao iniciar a página
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

  // Lógica para calcular a quantidade
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
  const filteredProducts = productsWithCalculatedQuantity.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const currentProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  // Função de Adicionar, conectada à API
  const handleAddProduct = async (newProductData: Omit<Product, 'id' | 'quantity' | 'history'>) => {
    if (products.some(p => p.sku.toLowerCase() === newProductData.sku.toLowerCase())) {
      alert('Erro: O SKU já existe na lista atual.');
      return;
    }
    // Adicionando validações da versão "nova"
    if (!newProductData.sku.trim() || !newProductData.name.trim() || !newProductData.brand.trim()) {
      alert('Erro: SKU, Nome e Marca são obrigatórios.'); return;
    }
    if (newProductData.costPrice <= 0) {
      alert('Erro: O preço de custo deve ser maior que zero.'); return;
    }


    try {
      // Inicia a submissão 
      setIsSubmitting(true);


      const completeProductData = {
        ...newProductData,
        quantity: 0, // Quantidade inicial é sempre 0
        buyedUnits: 0,
        local: 'Indefinido',
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função de Editar, agora conectada à API e com controle de submissão
  const handleEditProduct = async (updatedProductData: Omit<Product, 'quantity'>) => {
    const originalProduct = products.find(p => p.sku === updatedProductData.sku);
    if (!originalProduct) return;

    // <-- 1. Adicionamos o bloco try/catch/finally
    try {
      // <-- 2. Ativamos o estado de submissão
      setIsSubmitting(true);

      const currentBestPrice = originalProduct.history?.bestPrice || originalProduct.costPrice;
      const productToSend = {
        ...updatedProductData,
        history: {
          lastEditDate: new Date().toLocaleDateString('pt-BR'),
          previousPrice: originalProduct.costPrice,
          bestPrice: Math.min(currentBestPrice, updatedProductData.costPrice),
        },
      };

      // <-- 3. Fazemos a chamada PUT para o backend
      const response = await api.put(`/product/${updatedProductData.sku}`, productToSend);

      // <-- 4. Atualizamos o estado local com a resposta do servidor
      setProducts(current =>
        current.map(p => (p.sku === updatedProductData.sku ? response.data : p))
      );
      setIsModalOpen(false);

    } catch (error) {
      console.error("Erro ao editar produto:", error);
      alert("Não foi possível salvar as alterações do produto.");
    } finally {
      // <-- 5. Desativamos o estado de submissão em qualquer cenário
      setIsSubmitting(false);
    }
  };

  // Função de Deletar, conectada à API e usando SKU
  const handleDeleteProduct = async (skuToDelete: string) => {
    try {
      await api.delete(`/product/${skuToDelete}`);
      setProducts(current => current.filter(product => product.sku !== skuToDelete));
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      alert("Não foi possível deletar o produto.");
    }
  };

  const handleRequestDeletion = async (skuToRequest: string) => {
    try {
      await api.post(`/product/request-deletion/${skuToRequest}`);
      alert('Solicitação de exclusão enviada para o administrador.');
      // Opcional: Você pode adicionar uma lógica para desabilitar o botão
      // ou mudar o status visual do item na tabela após a solicitação.
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Não foi possível enviar a solicitação de exclusão.');
      }
      console.error("Erro ao solicitar exclusão:", error);
    }
  };

  // Funções auxiliares para abrir modais e exportar
  const handleExport = () => {
    const dataToExport = filteredProducts.map(product => ({
      'SKU': product.sku,
      'Nome do Produto': product.name,
      'Cor': product.color || '-',
      'Preço de Custo': product.costPrice,
      'Quantidade': product.quantity,
      'Marca': product.brand,
      'Melhor Preço': product.history?.bestPrice,
      // A data do melhor preço será a data da última edição, como guardado no histórico
      'Data (Melhor Preço)': product.history?.lastEditDate,
    }));

    // 2. Chama a função de exportação com os dados já preparados
    exportToExcel(dataToExport, 'inventario_kualie_bijux');
  };
  
  const openAddModal = () => {
    // ADICIONADO PARA TESTAR O CLIQUE
    console.log("Botão 'Adicionar Produto' foi clicado!");

    setModalMode('add');
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => { setModalMode('edit'); setProductToEdit(product); setIsModalOpen(true); };
  const openCloneModal = (product: Product) => { setModalMode('clone'); setProductToEdit(product); setIsModalOpen(true); };
  const openHistoryModal = (product: Product) => { setProductForHistory(product); setIsHistoryModalOpen(true); };

  const handleSave = (productData: any) => {
    if (modalMode === 'edit') {
      handleEditProduct(productData);
    } else {
      handleAddProduct(productData);
    }
  };

  // Renderização do componente (JSX)
  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerActions}>
        <input type="text" placeholder="Pesquisar por nome, marca ou SKU..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={styles.searchInput} />
        <div className={styles.buttonGroup}>
          <button className={styles.button} onClick={openAddModal}>Adicionar Produto</button>
          <button className={`${styles.button} ${styles.exportButton}`} onClick={handleExport}>Exportar</button>
        </div>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nome do Produto</th>
              <th>Cor</th>
              <th>Preço de Custo</th>
              <th>Quantidade</th>
              <th>Marca</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.map((product) => {
              const menuOptions = [
                { label: 'Editar', onClick: () => openEditModal(product) },
                { label: 'Histórico', onClick: () => openHistoryModal(product) },
                { label: 'Clonar', onClick: () => openCloneModal(product) },
              ];

              // --- MUDANÇA PRINCIPAL AQUI ---
              if (user?.role === 'ADMIN') {
                // Se for ADMIN, o botão deleta diretamente
                menuOptions.splice(1, 0, {
                  label: 'Excluir',
                  onClick: () => handleDeleteProduct(product.sku)
                });
              } else if (user?.role === 'USUARIO') {
                // Se for USUARIO, o botão solicita a exclusão
                menuOptions.splice(1, 0, {
                  label: 'Solicitar Exclusão',
                  onClick: () => handleRequestDeletion(product.sku)
                });
              }

              return (
                <tr key={product.sku}>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.color || '-'}</td>
                  <td>{product.costPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td>{product.quantity}</td>
                  <td>{product.brand}</td>
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
      <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} mode={modalMode} initialData={productToEdit} isSubmitting={isSubmitting} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} product={productForHistory} />
    </div>
  );
}