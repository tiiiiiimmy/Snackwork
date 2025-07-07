import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { SnackDetail } from './pages/SnackDetail';
import { AddSnack } from './pages/AddSnack';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/snacks/:id" element={<SnackDetail />} />
            <Route path="/add-snack" element={<AddSnack />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
