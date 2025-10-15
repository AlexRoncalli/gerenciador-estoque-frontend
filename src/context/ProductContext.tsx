import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Product, ProductLocation, ProductExit } from '../types';
import  api  from '../services/api'; // Importe a API
import { AuthContext } from './AuthContext';

// Interface que define tudo que o contexto vai fornecer
interface ProductContextData {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  locations: ProductLocation[];
  setLocations: React.Dispatch<React.SetStateAction<ProductLocation[]>>;
  exits: ProductExit[];
  setExits: React.Dispatch<React.SetStateAction<ProductExit[]>>;
  masterLocations: string[];
  addMasterLocation: (newLocation: string) => Promise<void>;
  removeMasterLocation: (locationName: string) => Promise<void>;
  findProductBySku: (sku: string) => Product | undefined;
}

const ProductContext = createContext<ProductContextData | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useContext(AuthContext); // <-- Pegue o status de autenticação


  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<ProductLocation[]>([]);
  const [exits, setExits] = useState<ProductExit[]>([]);
  const [masterLocations, setMasterLocations] = useState<string[]>([]);

  // EFEITO PARA CARREGAR TODOS OS DADOS INICIAIS DO BACKEND
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Carrega produtos, localizações ocupadas e a lista mestra em paralelo
        const [productsResponse, locationsResponse, masterLocationsResponse] = await Promise.all([
          api.get('/products'),
          api.get('/locations'),
          api.get('/master-locations')
        ]);
        setProducts(productsResponse.data);
        setLocations(locationsResponse.data);
        setMasterLocations(masterLocationsResponse.data);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      }
    }
    // Só carrega os dados SE o usuário estiver autenticado
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]); // <-- O efeito agora depende do status de autenticação


  // FUNÇÃO PARA ADICIONAR UM NOVO LOCAL NA LISTA MESTRA (AGORA COM API)
  const addMasterLocation = async (newLocation: string) => {
    if (newLocation && !masterLocations.includes(newLocation)) {
      try {
        await api.post('/master-location', { name: newLocation });
        setMasterLocations(current => [...current, newLocation].sort());
      } catch (error) {
        console.error("Erro ao adicionar localização mestre:", error);
      }
    }
  };

  // FUNÇÃO PARA REMOVER UM LOCAL DA LISTA MESTRA (AGORA COM API)
  const removeMasterLocation = async (locationName: string) => {
    try {
      await api.delete(`/master-location/${encodeURIComponent(locationName)}`);
      setMasterLocations(current => current.filter(loc => loc !== locationName));
    } catch (error) {
      console.error("Erro ao remover localização mestre:", error);
      alert("Falha ao remover a localização.");
    }
  };

  const findProductBySku = (sku: string): Product | undefined => {
    return products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
  };

  const contextValue = {
    products, setProducts,
    locations, setLocations,
    exits, setExits,
    masterLocations,
    addMasterLocation,
    removeMasterLocation,
    findProductBySku,
  };

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}