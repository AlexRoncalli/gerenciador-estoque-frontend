import { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useProducts } from '../../context/ProductContext';
import styles from './Dashboard.module.css';
import { RepurchaseModal } from './components/RepurchaseModal';
import { StagnantItemsModal } from './components/StagnantItemsModal';
import { Store, Product } from '../../types';

const COLORS = ['#0d6efd', '#6f42c1', '#fd7e14', '#198754', '#dc3545', '#0dcaf0'];
const PIE_COLORS = ['#198754', '#dc3545', '#fd7e14']; // OK, Recompra, Sem Saída

const availableStores: Store[] = ['Shein', 'Amazon', 'Mercado Livre', 'Shopee', 'Magazine Luiza'];

const parseDate = (dateString: string): Date => {
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
};

export function Dashboard() {
  const { exits, products, locations } = useProducts();

  const [selectedStores, setSelectedStores] = useState<Store[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isRepurchaseModalOpen, setIsRepurchaseModalOpen] = useState(false);
  const [isStagnantModalOpen, setIsStagnantModalOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Lógica do gráfico de barras (inalterada)
  const barChartData = useMemo(() => {
    const totalExpedicao = exits.filter(e => e.exitType === 'Expedição').reduce((sum, e) => sum + e.quantity, 0);
    const fullExits = exits.filter(e => e.exitType === 'Full');
    const totalFull = fullExits.reduce((sum, e) => sum + e.quantity, 0);
    let data = [{ name: 'Expedição', quantidade: totalExpedicao }, { name: 'Full (Total)', quantidade: totalFull }];
    selectedStores.forEach(store => {
      const totalStore = fullExits.filter(e => e.store === store).reduce((sum, e) => sum + e.quantity, 0);
      data.push({ name: store, quantidade: totalStore });
    });
    return data;
  }, [exits, selectedStores]);

  // A LÓGICA DE CÁLCULO FOI REFEITA AQUI
  const { pieChartData, productsToRepurchase, stagnantItems } = useMemo(() => {
    const today = new Date();
    const repurchaseList: (Product & { currentQuantity: number })[] = [];
    const stagnantList: (Product & { currentQuantity: number, daysSinceLastMovement: number })[] = [];
    let okCount = 0;

    products.forEach(product => {
      const currentQuantity = locations
        .filter(loc => loc.sku === product.sku)
        .reduce((sum, loc) => sum + (loc.volume * loc.unitsPerBox), 0);

      const needsRepurchase = product.repurchaseRule && currentQuantity <= product.repurchaseRule;

      let isStagnant = false;
      let daysSinceLastMovement = 0;

      if (currentQuantity > 0) {
        const allMovementDates = [
          ...locations.filter(loc => loc.sku === product.sku).map(loc => parseDate(loc.date)),
          ...exits.filter(ex => ex.sku === product.sku).map(ex => parseDate(ex.date))
        ];

        if (allMovementDates.length > 0) {
          const lastMovementDate = new Date(Math.max(...allMovementDates.map(date => date.getTime())));
          const diffTime = Math.abs(today.getTime() - lastMovementDate.getTime());
          daysSinceLastMovement = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (daysSinceLastMovement > 30) {
            isStagnant = true;
          }
        }
      }

      // Lógica de prioridade para evitar contagem dupla
      if (needsRepurchase) {
        repurchaseList.push({ ...product, currentQuantity });
      } else if (isStagnant) {
        stagnantList.push({ ...product, currentQuantity, daysSinceLastMovement });
      } else {
        okCount++;
      }
    });

    const data = [
      { name: 'Stock OK', value: okCount },
      { name: 'Precisa de Recompra', value: repurchaseList.length },
      { name: 'Sem Saída (>30d)', value: stagnantList.length },
    ];
    return { pieChartData: data, productsToRepurchase: repurchaseList, stagnantItems: stagnantList };
  }, [products, locations, exits]);

  const handleStoreToggle = (store: Store) => {
    setSelectedStores(prev => prev.includes(store) ? prev.filter(item => item !== store) : [...prev, store]);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Card do Gráfico de Barras */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Quantidade de Produtos por Saída</h2>
          <div className={styles.dropdown} ref={dropdownRef}>
            <button className={styles.dropdownButton} onClick={() => setIsDropdownOpen(prev => !prev)}>
              Selecionar Lojas
            </button>
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                {availableStores.map(store => (
                  <label key={store} className={styles.dropdownItem}>
                    <input type="checkbox" checked={selectedStores.includes(store)} onChange={() => handleStoreToggle(store)} />
                    {store}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="quantidade">
              {barChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Card do Gráfico de Pizza e Listas */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Status do Inventário</h2>
          <div className={styles.buttonGroup}>
            <button className={styles.button} onClick={() => setIsRepurchaseModalOpen(true)}>
              Ver Lista de Recompra ({productsToRepurchase.length})
            </button>
            <button className={styles.button} onClick={() => setIsStagnantModalOpen(true)}>
              Ver Itens Sem Saída ({stagnantItems.length})
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieChartData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} (${value})`} outerRadius={100} fill="#8884d8" dataKey="value">
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <RepurchaseModal isOpen={isRepurchaseModalOpen} onClose={() => setIsRepurchaseModalOpen(false)} productsToRepurchase={productsToRepurchase} />

      <StagnantItemsModal
        isOpen={isStagnantModalOpen}
        onClose={() => setIsStagnantModalOpen(false)}
        stagnantItems={stagnantItems}
      />
    </div>
  );
}

