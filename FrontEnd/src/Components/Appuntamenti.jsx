import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
import '../Styles/Appuntamenti.css';
import logo from '../Assets/logo.png';

function Appuntamenti() {
  const navigate = useNavigate();
  
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/google';
  };

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appuntamenti, setAppuntamenti] = useState([]);
  const [nota, setNota] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orariDisponibili, setOrariDisponibili] = useState([]);
  const [orarioSelezionato, setOrarioSelezionato] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [operators, setOperators] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState('');
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedServiceDuration, setSelectedServiceDuration] = useState(0);
  
  // Carica gli operatori
  useEffect(() => {
    if (isAuthenticated) {
      axios.get('http://localhost:5000/operators')
        .then(response => {
          setOperators(response.data);
        })
        .catch(error => {
          console.error('Errore nel caricamento degli operatori:', error);
        });
    }
  }, [isAuthenticated]);

  // Verifica autenticazione e ruolo utente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);

      // Verifica se l'utente è admin
      fetch('http://localhost:5000/check-admin', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.isAdmin) {
          window.location.href = '/admin';
        }
      })
      .catch(error => console.error('Errore nel controllo admin:', error));

      // Decodifica il token per ottenere le informazioni dell'utente
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserInfo({
          name: decodedToken.name,
          email: decodedToken.email
        });
      } catch (error) {
        console.error('Errore nel decodificare il token:', error);
      }
    }
  }, []);

  // Funzione per ottenere gli orari disponibili dal backend
  const getOrariDisponibili = async (data, operatorId, servizioId) => {
    if (!operatorId || !servizioId) {
      setOrariDisponibili([]);
      return;
    }
    
    try {
      const response = await axios.get('http://localhost:5000/orari-disponibili', {
        params: {
          data: data.toISOString(),
          operatorId: operatorId,
          servizioId: servizioId
        }
      });
      setOrariDisponibili(response.data);
    } catch (error) {
      console.error('Errore nel recupero degli orari disponibili:', error);
      setOrariDisponibili([]);
    }
  };

  // Gestisce il cambio dell'operatore
  const handleOperatorChange = (operatorId) => {
    setSelectedOperator(operatorId);
    setSelectedService('');
    setOrariDisponibili([]);
    
    if (operatorId) {
      const operator = operators.find(op => op._id === operatorId);
      if (operator) {
        setServices(operator.services);
      }
    } else {
      setServices([]);
    }
  };

  // Gestisce il cambio del servizio
  const handleServiceChange = (serviceId) => {
    setSelectedService(serviceId);
    if (serviceId && selectedOperator) {
      const operator = operators.find(op => op._id === selectedOperator);
      const service = operator.services.find(s => s.service._id === serviceId);
      if (service) {
        setSelectedServiceDuration(service.duration);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      axios.get('http://localhost:5000/services')
        .then(response => {
          setServices(response.data);
        })
        .catch(error => {
          console.error('Errore nel caricamento dei servizi:', error);
        });

      axios.get('http://localhost:5000/appuntamenti')
        .then(response => {
          setAppuntamenti(response.data);
        })
        .catch(error => {
          if (error.response?.status === 401) {
            // Token non valido o scaduto
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setIsAuthenticated(false);
          }
          console.error('Errore nel caricamento degli appuntamenti', error);
        });
    }
  }, [isAuthenticated]);

  // Aggiorna gli orari disponibili quando cambia l'operatore o il servizio selezionato
  useEffect(() => {
    if (selectedDate && selectedOperator && selectedService) {
      getOrariDisponibili(selectedDate, selectedOperator, selectedService);
    }
  }, [selectedOperator, selectedService, selectedDate]);

  const onDayClick = (value) => {
    setSelectedDate(value);
    setOrarioSelezionato('');
    setSelectedOperator('');
    setSelectedService('');
    setIsModalOpen(true);
  };

  const prenotaAppuntamento = async () => {
    if (!orarioSelezionato || !selectedOperator || !selectedService) {
      alert('Seleziona un operatore, un servizio e un orario per procedere');
      return;
    }

    if (!userInfo) {
      alert('Informazioni utente non disponibili. Prova a effettuare nuovamente il login.');
      handleLogout();
      return;
    }
    
    try {
      await axios.post('http://localhost:5000/appuntamenti', {
        data: selectedDate,
        nota,
        nomeCliente: userInfo.name,
        email: userInfo.email,
        orario: orarioSelezionato,
        operator: selectedOperator,
        service: selectedService,
        duration: selectedServiceDuration,
      });
      setAppuntamenti([
        ...appuntamenti,
        { data: selectedDate, nota, nomeCliente: userInfo.name, orario: orarioSelezionato }
      ]);
      setIsModalOpen(false);
      setNota('');
      setOrarioSelezionato('');
      alert('Appuntamento prenotato con successo!');
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
      } else if (error.response?.status === 400) {
        alert(error.response.data.message || 'Questo orario è già prenotato per la data selezionata');
      } else {
        alert('Si è verificato un errore durante la prenotazione dell\'appuntamento');
      }
      console.error('Errore nella prenotazione dell\'appuntamento', error);
    }
  };

  // Funzione per disabilitare le date passate e gestire la classe dei giorni con appuntamenti
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      // Verifica se ci sono appuntamenti per questa data
      const hasAppointments = appuntamenti.some(
        appuntamento => 
          new Date(appuntamento.data).toLocaleDateString() === date.toLocaleDateString()
      );
      
      // Se ci sono appuntamenti, aggiungi la classe appropriata
      return hasAppointments ? 'giorno-con-appuntamenti' : null;
    }
    return null;
  };

  // Funzione per disabilitare le date passate
  const tileDisabled = ({ date }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Gestisce il callback di autenticazione
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      
      // Rimuovi il token dall'URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Ottieni le informazioni dell'utente dal token
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserInfo({
          name: decodedToken.name,
          email: decodedToken.email
        });
      } catch (error) {
        console.error('Errore nel decodificare il token:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUserInfo(null);
    setAppuntamenti([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <img src={logo} alt="Logo" className="login-logo" />
        <h2 className="login-title">Accedi per gestire i tuoi appuntamenti</h2>
        <button onClick={handleGoogleLogin} className="google-login-button">
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google"
            className="google-icon"
          />
          Accedi con Google
        </button>
      </div>
    );
  }

  return (
    <div className="appointments-container">
      <div className="header-container">
        <h2 className="welcome-text">Benvenuto, {userInfo?.name}</h2>
        <div className="button-group">
          <button onClick={() => navigate('/profile')} className="nav-button profile-button">
            <i className="fas fa-calendar-check"></i>
            I Miei Appuntamenti
          </button>
          <button onClick={handleLogout} className="nav-button logout-button">
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </div>

      <div className="calendar-header">
        <h3>Seleziona una data per prenotare un appuntamento</h3>
      </div>

      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        onClickDay={onDayClick}
        tileClassName={tileClassName}
        tileDisabled={tileDisabled}
      />

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Prenota Appuntamento</h3>
            </div>
            
            <div className="form-group">
              <label>Note aggiuntive:</label>
              <textarea
                className="form-control"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Inserisci una nota per l'appuntamento"
              />
            </div>

            <div className="form-group">
              <label>Seleziona un operatore:</label>
              <select 
                className="form-control"
                value={selectedOperator}
                onChange={(e) => handleOperatorChange(e.target.value)}
              >
                <option value="" disabled>Seleziona un operatore</option>
                {operators.map((operator) => (
                  <option key={operator._id} value={operator._id}>
                    {operator.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedOperator && (
              <div className="form-group">
                <label>Seleziona un servizio:</label>
                <select 
                  className="form-control"
                  value={selectedService}
                  onChange={(e) => handleServiceChange(e.target.value)}
                >
                  <option value="" disabled>Seleziona un servizio</option>
                  {services.map((serviceObj) => (
                    <option key={serviceObj.service._id} value={serviceObj.service._id}>
                      {serviceObj.service.name} ({serviceObj.duration} min)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Seleziona un orario:</label>
              <select 
                className="form-control"
                value={orarioSelezionato} 
                onChange={(e) => setOrarioSelezionato(e.target.value)}
              >
                <option value="" disabled>Seleziona un orario</option>
                {orariDisponibili.map((orario, index) => (
                  <option key={index} value={orario}>{orario}</option>
                ))}
              </select>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                <i className="fas fa-times"></i> Annulla
              </button>
              <button className="btn btn-primary" onClick={prenotaAppuntamento}>
                <i className="fas fa-check"></i> Prenota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appuntamenti;
