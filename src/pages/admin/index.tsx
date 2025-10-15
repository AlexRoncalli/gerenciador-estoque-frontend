import { useState, useEffect } from 'react';
import  api  from '../../services/api';
import styles from './Admin.module.css'; // Criaremos este arquivo a seguir

interface DeletionRequest {
  id: string;
  productSku: string;
  status: string;
  requestedById: string;
  create_at: string;
}

export function AdminPage() {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      try {
        const response = await api.get('/admin/deletion-requests');
        setRequests(response.data);
      } catch (error) {
        console.error("Erro ao buscar solicitações:", error);
        alert("Não foi possível carregar as solicitações.");
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, []);

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

      {requests.length === 0 ? (
        <p>Não há solicitações pendentes no momento.</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>SKU do Produto</th>
                <th>Data da Solicitação</th>
                <th>Solicitado Por</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td>{req.productSku}</td>
                  <td>{new Date(req.create_at).toLocaleDateString('pt-BR')}</td>
                  <td>{req.requestedById}</td>
                  <td className={styles.actionsCell}>
                    <button onClick={() => handleApprove(req.id)} className={`${styles.button} ${styles.approveButton}`}>
                      Aprovar
                    </button>
                    <button onClick={() => handleReject(req.id)} className={`${styles.button} ${styles.rejectButton}`}>
                      Rejeitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}