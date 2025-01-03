import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../Assets/logo.png';
import '../Styles/UserProfile.css';

function UserProfile() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decodifica il token per ottenere le informazioni dell'utente
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        console.log('Token decodificato:', decodedToken);
        
        setIsAuthenticated(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        fetchUserAppointments();
      } catch (error) {
        console.error('Errore nella decodifica del token:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const [successMessage, setSuccessMessage] = useState(null);

  const handleCancelAppointment = async (appointmentId) => {
    try {
      console.log('Cancellazione appuntamento con ID:', appointmentId);
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5000/appuntamenti/${appointmentId.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Mostra il messaggio di successo
      setSuccessMessage('Appuntamento disdetto con successo');
      // Pulisci il messaggio dopo 3 secondi
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Aggiorna la lista degli appuntamenti dopo la disdetta
      fetchUserAppointments();
    } catch (err) {
      console.error('Errore nella disdetta dell\'appuntamento:', err);
      setError('Errore nella disdetta dell\'appuntamento');
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
      }
    }
  };

  const fetchUserAppointments = async () => {
    try {
      console.log('Recupero appuntamenti per utente...');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trovato');
      }

      // Decodifica il token per ottenere le informazioni dell'utente
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      console.log('Info utente dal token:', {
        id: decodedToken.id,
        role: decodedToken.role,
        email: decodedToken.email
      });

      const response = await axios.get('http://localhost:5000/appuntamenti', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Appuntamenti ricevuti:', response.data);
      setAppointments(response.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Errore nel caricamento degli appuntamenti:', err);
      setError('Errore nel caricamento degli appuntamenti');
      setLoading(false);
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
      }
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/google';
  };

  if (loading) return <div>Caricamento...</div>;

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <img src={logo} alt="Logo" className="login-logo" />
        <h2>Accedi per vedere i tuoi appuntamenti</h2>
        <button onClick={handleGoogleLogin} className="google-login-button">
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google"
            style={{ width: '20px', height: '20px' }}
          />
          Accedi con Google
        </button>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="user-profile-header">
        <h2 className="user-profile-title">I Tuoi Appuntamenti</h2>
        <button onClick={() => navigate('/')} className="home-button">
          Torna alla Home
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {!error && (
        <div className="appointments-grid">
          {appointments.length === 0 ? (
            <p className="empty-state">Non hai ancora prenotato appuntamenti.</p>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment._id} className="appointment-card">
                <h3 className="appointment-date">
                  Appuntamento del {new Date(appointment.data).toLocaleDateString()}
                </h3>
                <p className="appointment-info">Ora: {appointment.orario}</p>
                <p className="appointment-info">
                  Servizio: {appointment.service?.name || 'Non specificato'}
                </p>
                <p className="appointment-info">
                  Durata: {appointment.duration} minuti
                </p>
                <p className="appointment-info">
                  Note: {appointment.nota || 'Nessuna nota'}
                </p>
                <p className="appointment-info">
                  Cliente: {appointment.nomeCliente}
                </p>
                <p className="appointment-info">
                  Operatore: {appointment.operator?.name || 'Non specificato'}
                </p>
                <button
                  onClick={() => handleCancelAppointment(appointment._id)}
                  className="cancel-button"
                >
                  Disdici Appuntamento
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default UserProfile;
