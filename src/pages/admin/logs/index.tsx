import { useState, useEffect, useContext } from 'react';
import  api  from '../../../services/api';
import styles from './AuditLog.module.css'; // Criaremos este arquivo
import { AuthContext } from '../../../context/AuthContext';

interface AuditLog {
  id: string;
  actionType: string;
  userId: string;
  details: string | null;
  timestamp: string;
}

export function AuditLogPage() {
  const { isAuthenticated } = useContext(AuthContext);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const response = await api.get('/admin/audit-logs');
        setLogs(response.data);
      } catch (error) {
        console.error("Erro ao buscar logs de auditoria:", error);
        alert("Não foi possível carregar os logs.");
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadLogs();
    }
  }, [isAuthenticated]);

  if (loading) {
    return <div>Carregando logs de auditoria...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Log de Auditoria</h1>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Ação</th>
              <th>ID do Usuário</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                <td>{log.actionType}</td>
                <td>{log.userId}</td>
                <td>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}