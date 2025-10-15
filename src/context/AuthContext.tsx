import { createContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import  api  from '../services/api';

interface AuthProviderProps {
  children: ReactNode;
}

interface User {
  id: string;
  name: string;
  role: 'ADMIN' | 'USUARIO';
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
}

interface SignInCredentials {
  name: string;
  password: string;
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const isAuthenticated = !!user;

  // Efeito para carregar os dados do usuário se o token já existir (ao recarregar a página)
  useEffect(() => {
    const token = localStorage.getItem('@gerenciador:token');

    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Aqui você poderia buscar os dados do usuário com base no token se necessário
      // Por simplicidade, vamos decodificar o token para pegar os dados.
      // Em um app real, uma rota /me no backend seria ideal.
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: decoded.sub, name: decoded.name, role: decoded.role });
      } catch (error) {
        console.error("Erro ao decodificar o token:", error);
        signOut();
      }
    }
  }, []);

  async function signIn({ name, password }: SignInCredentials) {
    try {
      const response = await api.post('/login', { name, password });
      const { token } = response.data;

      // Armazenar o token no localStorage
      localStorage.setItem('@gerenciador:token', token);

      // Configurar o header de autorização para todas as requisições futuras
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Decodificar o token para obter os dados do usuário
      const decoded = JSON.parse(atob(token.split('.')[1]));
      setUser({ id: decoded.sub, name: decoded.name, role: decoded.role });

      navigate('/');

    } catch (error) {
      console.error("Falha no login:", error);
      throw new Error("Usuário ou senha inválidos.");
    }
  }

  function signOut() {
    localStorage.removeItem('@gerenciador:token');
    setUser(null);
    // Remove o header de autorização
    delete api.defaults.headers.common['Authorization'];

    navigate('/login');
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}