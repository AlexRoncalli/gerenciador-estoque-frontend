import { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import RuleFolderIcon from '@mui/icons-material/RuleFolder';
import WeekendIcon from '@mui/icons-material/Weekend';
import  api  from '../../services/api';

function StatCard({ title, value, icon }: { title: string, value: number | string, icon: React.ReactElement }) {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '12px'
      }}
    >
      <Box>
        <Typography color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="p">
          {value}
        </Typography>
      </Box>
      <Box sx={{ color: 'primary.main' }}>
        {icon}
      </Box>
    </Paper>
  );
}

export function Home() {
  const { user } = useContext(AuthContext);
  const { products, locations, masterLocations } = useProducts();
  const [pendingRequests, setPendingRequests] = useState(0);

  // Efeito para buscar dados exclusivos do admin
  useEffect(() => {
    async function loadAdminData() {
      if (user?.role === 'ADMIN') {
        try {
          const response = await api.get('/admin/deletion-requests/count');
          setPendingRequests(response.data.pendingRequests);
        } catch (error) {
          console.error("Erro ao buscar contagem de solicitações:", error);
        }
      }
    }
    loadAdminData();
  }, [user]);

  // Cálculos para os cartões
  const totalUniqueProducts = products.length;
  const totalItemsInStock = useMemo(() => {
    if (!locations) return 0;
    return locations.reduce((sum, loc) => sum + (loc.volume * (loc.unitsPerBox || 1)), 0);
  }, [locations]);
  const totalOccupiedLocations = locations.length;
  const totalFreeLocations = Math.max(0, masterLocations.length - totalOccupiedLocations);

  const totalLocations = locations.length;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Olá, {user?.name}!
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Bem-vindo(a) ao seu painel de gerenciamento de estoque. Aqui está um resumo do seu sistema.
      </Typography>

      {/* A SINTAXE CORRETA DO GRID V2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Produtos Cadastrados"
            value={totalUniqueProducts}
            icon={<InventoryIcon sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Itens Totais em Estoque"
            value={totalItemsInStock}
            icon={<AllInboxIcon sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Locais de Estoque Ocupados"
            value={totalLocations}
            icon={<LocationOnIcon sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Locais de Estoque Livres" value={totalFreeLocations} icon={<WeekendIcon sx={{ fontSize: 40 }} />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Solicitações Pendentes" value={pendingRequests} icon={<RuleFolderIcon sx={{ fontSize: 40 }} />} />
        </Grid>
      </Grid>

      <Box>
        <Typography variant="h6" gutterBottom>
          Ações Rápidas
        </Typography>
        <Button
          variant="contained"
          component={Link}
          to="/estoque"
          startIcon={<InventoryIcon />}
        >
          Gerenciar Estoque
        </Button>
      </Box>
    </Box>
  );
}