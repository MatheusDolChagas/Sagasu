import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { appToastOptions } from './lib/toastTheme';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResendVerification from './pages/ResendVerification';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import CreateCase from './pages/CreateCase';
import MyCases from './pages/MyCases';
import Profile from './pages/Profile';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import About from './pages/About';
import Materials from './pages/Materials';
import MapPage from './pages/MapPage';
import Sightings from './pages/Sightings';
import AdminContacts from './pages/AdminContacts';

const AdminDocumentation = lazy(() => import('./pages/AdminDocumentation'));

// Layout
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reenviar-confirmacao" element={<ResendVerification />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/cases/create" element={<CreateCase />} />
          <Route path="/my-cases" element={<MyCases />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/materiais" element={<Materials />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/sightings" element={<Sightings />} />
          <Route path="/admin/contacts" element={<AdminContacts />} />
          <Route
            path="/admin/docs"
            element={
              <Suspense
                fallback={
                  <div className="container mx-auto px-4 py-20 text-center text-dark">Carregando…</div>
                }
              >
                <AdminDocumentation />
              </Suspense>
            }
          />
        </Routes>
      </Layout>
      <Toaster position="top-right" toastOptions={appToastOptions} />
    </Router>
  );
}

export default App;
