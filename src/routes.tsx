import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext.tsx';

//Componente de Layout
import { Layout } from './components/layout/layout';

//Páginas
import { LoginPage } from './pages/Login/index.tsx';
import { Home } from './pages/Home/index.tsx';
import { Dashboard } from './pages/Dashboard/index.tsx';
import { Inventory } from './pages/Inventory/index.tsx';
import { Location } from './pages/Location/index.tsx';
import { Availability } from './pages/Availability/index.tsx';
import { Exit } from './pages/Exit/index.tsx';
import { PlaceholderPage } from './pages/_shared/PlaceholderPage';
import { AdminPage } from './pages/admin';
import { UserManagementPage } from './pages/admin/users';
import { AuditLogPage } from './pages/admin/logs';


function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useContext(AuthContext);
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export function AppRoutes() {
    return (
        <Routes>
            {/* Rota pública de Login, fora do layout principal */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rota "Pai" que protege e aplica o layout a todas as rotas filhas */}
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <Layout />
                    </PrivateRoute>
                }
            >
                {/* Rotas "Filhas" - serão renderizadas dentro do <Outlet /> do Layout */}
                <Route index element={<Home />} /> {/* 'index' marca a rota padrão para "/" */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="estoque" element={<Inventory />} />
                <Route path="localizacao" element={<Location />} />
                <Route path="disponibilidade" element={<Availability />} />
                <Route path="saida" element={<Exit />} />
                {/* ADICIONE A NOVA ROTA DE ADMIN AQUI */}
                <Route path="admin/solicitacoes" element={<AdminPage />} />
                {/* ROTAS DE ADMIN */}
                <Route path="admin/solicitacoes" element={<AdminPage />} />
                <Route path="admin/usuarios" element={<UserManagementPage />} />
                <Route path="admin/logs" element={<AuditLogPage />} /> {/* <-- ADICIONE A NOVA ROTA */}
            </Route>
            {/* Rota para redirecionar qualquer caminho não encontrado */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}