import { useState, useEffect, useMemo } from 'react';
import  api  from '../../services/api';
import styles from './Admin.module.css'; // Criaremos este arquivo a seguir

interface DeletionRequest {
  id: string;
  productSku: string;
  status: string;
  requestedById: string;
  create_at: string;
}

interface User {
  id: string;
  name: string;
}

export function AdminPage() {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 5. Busca ambos em paralelo
        const [requestsResponse, usersResponse] = await Promise.all([
          api.get('/admin/deletion-requests'), // Endpoint das solicitações
          api.get('/admin/users')              // Endpoint dos usuários
        ]);
        setRequests(requestsResponse.data);
        setUsers(usersResponse.data);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        alert("Falha ao carregar solicitações pendentes.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []); // Roda apenas uma vez

  const handleApprove = async (requestId: string) => {
    try {
      await api.post(`/admin/deletion-requests/${requestId}/approve`);
      setRequests(current => current.filter(req => req.id !== requestId));
      alert("Solicitação aprovada e produto excluído.");
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      alert("Falha ao aprovar a solicitação.");
    }
  };

  const userMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    users.forEach(user => {
      map[user.id] = user.name;
    });
    return map;
  }, [users]);

  const handleReject = async (requestId: string) => {
    try {
      await api.post(`/admin/deletion-requests/${requestId}/reject`);
      setRequests(current => current.filter(req => req.id !== requestId));
      alert("Solicitação rejeitada.");
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
      alert("Falha ao rejeitar a solicitação.");
    }
  };

  if (loading) {
    return <div>Carregando solicitações...</div>;
  }

   return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Gerenciar Solicitações de Exclusão</h1>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>SKU do Produto</th>
              <th>Data da Solicitação</th>
              {/* O cabeçalho já está correto */}
              <th>Solicitado Por</th> 
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>Nenhuma solicitação pendente.</td>
              </tr>
            ) : (
              requests.map(request => (
                <tr key={request.id}>
                  <td>{request.productSku}</td>
                  <td>{new Date(request.create_at).toLocaleString('pt-BR')}</td>
                  
                  {/* 7. Usa o mapa para exibir o nome */}
                  <td>
                    {userMap[request.requestedById] ? userMap[request.requestedById] : (
                      <em title={`ID: ${request.requestedById}`}>Usuário desconhecido</em>
                    )}
                  </td>
                  
                  <td className={styles.actionsCell}>
                    <button onClick={() => handleApprove(request.id)} className={styles.approveButton}>
                      Aprovar
                    </button>
                    <button onClick={() => handleReject(request.id)} className={styles.rejectButton}>
                      Rejeitar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}