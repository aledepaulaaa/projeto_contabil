import { Route, Switch, useLocation } from 'wouter';
import { Login } from './pages/Login/Login';
import { Cadastro } from './pages/Cadastro/Cadastro';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { RecuperarSenha } from './pages/RecuperarSenha/RecuperarSenha';
import { ResetarSenha } from './pages/ResetarSenha/ResetarSenha';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';

import { Assinaturas } from './pages/Assinaturas/Assinaturas';

function App() {
  const { isAuthenticated } = useAuthStore();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Basic route guard
    const publicRoutes = ['/login', '/cadastro', '/recuperar-senha', '/resetar-senha'];
    
    if (!isAuthenticated && !publicRoutes.includes(location)) {
      setLocation('/login');
    } else if (isAuthenticated && (location === '/' || location === '/login' || location === '/cadastro')) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, location, setLocation]);

  return (
    <ThemeProvider>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/cadastro" component={Cadastro} />
        <Route path="/recuperar-senha" component={RecuperarSenha} />
        <Route path="/resetar-senha" component={ResetarSenha} />
        <Route path="/assinaturas" component={Assinaturas} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/:sub*" component={Dashboard} />
        <Route>
          <div />
        </Route>
      </Switch>
    </ThemeProvider>
  );
}

export default App;
