import React, { useState, useEffect } from 'react';
import '../Styles/AppuntamentiDisdetti.css';
import axios from 'axios';
import { format, isValid } from 'date-fns';
import { it } from 'date-fns/locale';

function formatDateSafely(dateString) {
  try {
    const date = new Date(dateString);
    if (!isValid(date)) {
      return 'Data non valida';
    }
    return format(date, 'EEEE d MMMM yyyy', { locale: it });
  } catch (error) {
    console.error('Errore nella formattazione della data:', error);
    return 'Data non valida';
  }
}

function AppuntamentiDisdetti() {
  const [appuntamenti, setAppuntamenti] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Token non trovato');
      return;
    }

    axios.get('http://localhost:5000/appuntamenti-disdetti', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      setAppuntamenti(response.data);
    })
    .catch(err => {
      console.error('Errore nel recupero degli appuntamenti disdetti:', err);
      setError('Errore nel recupero degli appuntamenti disdetti');
    });
  }, []);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="appuntamenti-container">
      <h2>Appuntamenti Disdetti</h2>
      <div className="appuntamenti-list">
        {appuntamenti.length === 0 ? (
          <p>Nessun appuntamento disdetto trovato</p>
        ) : (
          appuntamenti.map(appuntamento => (
            <div key={appuntamento._id} className="appuntamento-card">
              <div className="appuntamento-header">
                <h3>{appuntamento.nomeCliente}</h3>
                <span className="appuntamento-data">
                  {formatDateSafely(appuntamento.data)}
                </span>
              </div>
              <div className="appuntamento-details">
                <p><strong>Servizio:</strong> {appuntamento.service ? appuntamento.service.name : 'Non specificato'}</p>
                <p><strong>Orario:</strong> {appuntamento.orario}</p>
                {appuntamento.nota && (
                  <p><strong>Nota:</strong> {appuntamento.nota}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AppuntamentiDisdetti;
