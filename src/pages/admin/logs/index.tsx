import { useState, useEffect, useContext, useMemo } from 'react';
import api from '../../../services/api';
import styles from './AuditLog.module.css'; // Criaremos este arquivo
import { AuthContext } from '../../../context/AuthContext';
import { exportToExcel } from '../../../utils/exportToExcel';

interface AuditLog {
  id: string;
  actionType: string;
  userId: string;
  details: string | null;
  timestamp: string;
}

interface User {
  id: string;
  name: string;
}

export function AuditLogPage() {
  const { isAuthenticated } = useContext(AuthContext);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const [logsResponse, usersResponse] = await Promise.all([
          api.get('/admin/audit-logs'),
          api.get('/admin/users') // Rota que busca todos os usuários
        ]);
        setLogs(logsResponse.data);
        setUsers(usersResponse.data);
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

  const userMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    users.forEach(user => {
      map[user.id] = user.name;
    });
    return map;
  }, [users]);

  if (loading) {
    return <div>Carregando logs de auditoria...</div>;
  }

  const handleExport = () => {
    const dataToExport = logs.map(log => ({
      'Data/Hora': new Date(log.timestamp).toLocaleString('pt-BR'),
      'Ação': log.actionType,
      'Nome do Usuário': userMap[log.userId] || `ID: ${log.userId}`, // Usa o nome já traduzido
      'Detalhes': log.details || '-'
    }));
    exportToExcel(dataToExport, 'log_de_auditoria_kuaile');
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerActions}>
        <h1>Log de Auditoria</h1>
        <div className={styles.buttonGroup}>
          <button className={`${styles.button} ${styles.exportButton}`} onClick={handleExport}>
            Exportar para Excel
          </button>
        </div>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Ação</th>
              <th>Nome do Usuário</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                <td>{log.actionType}</td>
                <td>
                  {userMap[log.userId] ? userMap[log.userId] : (
                    <em title={`ID: ${log.userId}`}>Usuário desconhecido</em>
                  )}
                </td>
                <td>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}