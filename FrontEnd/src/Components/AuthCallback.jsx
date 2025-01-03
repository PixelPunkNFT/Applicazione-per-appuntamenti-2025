import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    
    if (token) {
      // Salva il token nel localStorage
      localStorage.setItem('token', token);
      
      // Reindirizza all'area admin
      navigate('/admin');
    } else {
      // Se non c'è token, reindirizza alla home
      navigate('/');
    }
  }, [navigate, location]);

  return null; // Questo componente non renderizza nulla
};

export default AuthCallback;
