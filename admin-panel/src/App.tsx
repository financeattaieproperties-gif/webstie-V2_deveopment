import { useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import TitleBar from './components/TitleBar';
import Properties from './pages/Properties';
import PropertyForm from './pages/PropertyForm';
import Projects from './pages/Projects';
import ProjectForm from './pages/ProjectForm';
import Leads from './pages/Leads';
import Settings from './pages/SettingsPage';
import Visits from './pages/Visits';
import Agents from './pages/Agents';
import AgentForm from './pages/AgentForm';
import Branches from './pages/Branches';
import BranchForm from './pages/BranchForm';
import SeoPage from './pages/SeoPage';
import Careers from './pages/Careers';
import CareerForm from './pages/CareerForm';
import CareerApplications from './pages/CareerApplications';
import ChatInbox from './pages/ChatInbox';

const isElectron = !!window.electronAPI?.isElectron;
const Router = isElectron ? HashRouter : BrowserRouter;
const basename = isElectron ? undefined : '/admin';

// Handles keyboard shortcuts sent from Electron's native app menu
function MenuNavigator() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!window.electronAPI) return;
    const unsub = window.electronAPI.onNavigate(navigate);
    return unsub;
  }, [navigate]);
  return null;
}

function ProtectedRoutes() {
  const { loggedIn } = useAuth();
  if (!loggedIn) return <Login />;
  return (
    <Layout>
      <MenuNavigator />
      <Routes>
        <Route path="/" element={<Navigate to="/properties" replace />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/new" element={<PropertyForm />} />
        <Route path="/properties/:id/edit" element={<PropertyForm />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/new" element={<ProjectForm />} />
        <Route path="/projects/:id/edit" element={<ProjectForm />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/chat" element={<ChatInbox />} />
        <Route path="/visits" element={<Visits />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/agents/new" element={<AgentForm />} />
        <Route path="/agents/:id/edit" element={<AgentForm />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/branches/new" element={<BranchForm />} />
        <Route path="/branches/:id/edit" element={<BranchForm />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/careers/new" element={<CareerForm />} />
        <Route path="/careers/:id/edit" element={<CareerForm />} />
        <Route path="/careers/applications" element={<CareerApplications />} />
        <Route path="/careers/:id/applications" element={<CareerApplications />} />
        <Route path="/seo" element={<SeoPage />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {isElectron && <TitleBar />}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Router basename={basename}>
            <ProtectedRoutes />
          </Router>
        </div>
      </div>
    </AuthProvider>
  );
}
