import { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import styles from './UserModal.module.css'; // Criaremos este arquivo
import { Role } from '../../types'; // Importa o tipo Role do backend

interface UserData {
  id?: string;
  name: string;
  password?: string;
  role: Role;
}

type UserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: UserData) => void;
  mode: 'add' | 'edit';
  initialData?: UserData | null;
};

export function UserModal({ isOpen, onClose, onSave, mode, initialData }: UserModalProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('USUARIO');

  useEffect(() => {
    if (isOpen) {
      if (initialData && mode === 'edit') {
        setName(initialData.name);
        setRole(initialData.role);
        setPassword(''); // Limpa a senha, pois não vamos editá-la
      } else {
        // Reseta para o modo de adição
        setName('');
        setPassword('');
        setRole('USUARIO');
      }
    }
  }, [isOpen, initialData, mode]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'add' && !password.trim()) {
      alert('A senha é obrigatória para criar um novo usuário.');
      return;
    }
    onSave({ id: initialData?.id, name, password, role });
  };

  const modalTitle = mode === 'add' ? 'Adicionar Novo Usuário' : `Editar Permissão de ${initialData?.name}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Nome do Usuário</label>
          <input 
            id="name" 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            readOnly={mode === 'edit'} // Não permite editar o nome
          />
        </div>

        {/* O campo de senha só aparece no modo de adição */}
        {mode === 'add' && (
          <div className={styles.formGroup}>
            <label htmlFor="password">Senha</label>
            <input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="role">Função (Role)</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="USUARIO">Usuário</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>

        <footer className={styles.formFooter}>
          <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
          <button type="submit" className={styles.submitButton}>Salvar</button>
        </footer>
      </form>
    </Modal>
  );
}