import { useState, useEffect, useContext } from 'react'; // <-- Adicione useContext
import  api  from '../../../services/api';
import { ActionMenu } from '../../../components/ActionMenu';
import { UserModal } from '../../../components/UserModal';
import styles from './UserManagement.module.css';
import { Role } from '../../../types';
import { AuthContext } from '../../../context/AuthContext';

interface User {
  id: string;
  name: string;
  role: 'ADMIN' | 'USUARIO';
  create_at: string;
}

export function UserManagementPage() {
  const { isAuthenticated } = useContext(AuthContext);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para controlar o modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await api.get('/admin/users');
        setUsers(response.data);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        alert("Não foi possível carregar a lista de usuários.");
      } finally {
        setLoading(false);
      }
    }

    // --- MUDANÇA PRINCIPAL AQUI ---
    // Só carrega os dados SE o usuário estiver autenticado
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated]); 

  const handleSaveUser = async (userData: any) => {
    try {
      if (modalMode === 'add') {
        const response = await api.post('/admin/user', { name: userData.name, password: userData.password, role: userData.role });
        setUsers(current => [...current, response.data]);
        alert("Usuário criado com sucesso!");
      } else if (modalMode === 'edit' && userToEdit) {
        const response = await api.put(`/admin/user/${userToEdit.id}`, { role: userData.role });
        setUsers(current => current.map(u => u.id === userToEdit.id ? { ...u, role: response.data.role } : u));
        alert("Permissão do usuário atualizada!");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      alert("Falha ao salvar usuário.");
    }
  };
  
  const handleDeleteUser = async (userId: string, userName: string) => {
    // ... (sua função de deletar continua a mesma)
  };

  const openAddModal = () => {
    setModalMode('add');
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setModalMode('edit');
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  if (loading) return <div>Carregando usuários...</div>;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Gerenciar Usuários</h1>
        <button className={styles.button} onClick={openAddModal}>Adicionar Novo Usuário</button>
      </header>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Função (Role)</th>
              <th>Data de Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
               const menuOptions = [
                { label: 'Editar Permissão', onClick: () => openEditModal(user) },
                { label: 'Excluir', onClick: () => handleDeleteUser(user.id, user.name) },
              ];

              return (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>
                    <span className={user.role === 'ADMIN' ? styles.roleAdmin : styles.roleUser}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.create_at).toLocaleDateString('pt-BR')}</td>
                  <td className={styles.actionsCell}>
                     <ActionMenu options={menuOptions} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        mode={modalMode}
        initialData={userToEdit}
      />
    </div>
  );
}