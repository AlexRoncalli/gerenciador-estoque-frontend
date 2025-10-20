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
  const handleAddProduct = async (newProductData: Omit<Product, 'id' | 'quantity'>) => {
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
        //local: 'Indefinido',
        history: { // Inicia o histórico com o melhor preço sendo o preço inicial
          lastEditDate: new Date().toLocaleDateString('pt-BR'),
          previousPrice: newProductData.costPrice,
          bestPrice: newProductData.costPrice,
          //imageUrl: newProductData.imageUrl
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
  const handleEditProduct = async (updatedProductData: Omit<Product, 'quantity' | 'id'>) => {
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
        current.map(p => (p.sku === updatedProductData.sku ? response.data : p))//operador ternario pro if do juru
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
    const excelHeaders = [
      'SKU',
      'Nome do Produto',
      'Cor',
      // Preço de Custo será inserido depois se for Admin
      'Quantidade',
      'Marca',
      'Origem',
      'Link da Imagem',
      // Melhor Preço / Data serão adicionados depois se for Admin
    ];

    // Adiciona cabeçalhos de Admin condicionalmente
    if (user?.role === 'ADMIN') {
      excelHeaders.splice(3, 0, 'Preço de Custo'); // Insere na 4ª posição (índice 3)
      excelHeaders.push('Melhor Preço', 'Data (Melhor Preço)'); // Adiciona no final
    }

    const dataToExport = filteredProducts.map(product => {
      // 1. Inicializa APENAS com os dados comuns, usando fallback ''
      const rowData: any = {
        'SKU': product.sku ?? '',
        'Nome do Produto': product.name ?? '',
        'Cor': product.color || '',
        'Quantidade': product.quantity ?? '', // Quantidade deve existir, mas fallback por segurança
        'Marca': product.brand ?? '',
        'Origem': product.supplier || '',
        'Link da Imagem': product.imageUrl || '',
      };

      // 2. ADICIONA os dados de Admin APENAS se for Admin
      if (user?.role === 'ADMIN') {
        rowData['Preço de Custo'] = product.costPrice ?? ''; // Use ?? '' como fallback
        rowData['Melhor Preço'] = product.history?.bestPrice ?? ''; // Use ?? '' como fallback
        rowData['Data (Melhor Preço)'] = product.history?.lastEditDate ?? ''; // Use ?? '' como fallback
      }
      console.log("socorro!!");

      return rowData;
    });

    // Mantenha os logs para a verificação final
    console.log("Dados para exportar (Simplificado):", dataToExport);
    console.log("Cabeçalhos para exportar:", excelHeaders);

    exportToExcel(dataToExport, 'inventario_kualie_bijux', excelHeaders);
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

          <button className={`${styles.button} ${styles.exportButton}`} onClick={handleExport}>Exportar para Excel</button>
        </div>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nome do Produto</th>
              <th>Cor</th>
              {user?.role === 'ADMIN' && <th>Preço de Custo</th>}
              <th>Quantidade</th>
              <th>Marca</th>
              <th>Origem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.map((product) => {
              // === ALTERAÇÃO 2: Lógica do Menu de Ações ===
              const menuOptions = [];

              // Opções COMUNS a todos os usuários (ou ajustar conforme regra de negócio)
              menuOptions.push({ label: 'Clonar', onClick: () => openCloneModal(product) });

              // Opções SOMENTE para ADMIN
              if (user?.role === 'ADMIN') {
                menuOptions.push(
                  { label: 'Editar', onClick: () => openEditModal(product) },
                  { label: 'Histórico', onClick: () => openHistoryModal(product) },
                  { label: 'Excluir', onClick: () => handleDeleteProduct(product.sku) }
                );
              }
              // Opção SOMENTE para USUARIO
              else if (user?.role === 'USUARIO') {
                menuOptions.push({
                  label: 'Solicitar Exclusão',
                  onClick: () => handleRequestDeletion(product.sku)
                });
              }

              // Opção de Imagem (comum a todos, se existir)
              if (product.imageUrl) {
                menuOptions.push({
                  label: 'Imagem',
                  onClick: () => window.open(product.imageUrl, '_blank', 'noopener,noreferrer')
                });
              }
              // === FIM DA ALTERAÇÃO 2 ===

              return (
                <tr key={product.sku}>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.color || '-'}</td>
                  {/* === ALTERAÇÃO 3: Ocultar Célula de Preço === */}
                  {user?.role === 'ADMIN' && (
                    <td>{product.costPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  )}
                  <td>{product.quantity}</td>
                  <td>{product.brand}</td>
                  <td>{product.supplier || '-'}</td>
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
      {/* Modais só são renderizados, mas a lógica de abrir pode ser restrita se necessário */}
      <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} mode={modalMode} initialData={productToEdit} isSubmitting={isSubmitting} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} product={productForHistory} />
    </div>
  );
}