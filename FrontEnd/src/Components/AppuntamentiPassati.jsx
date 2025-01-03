import { useState, useEffect } from 'react';
import axios from 'axios';

function AppuntamentiPassati() {
  const [appuntamenti, setAppuntamenti] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchAppuntamenti();
    }
  }, [token]);

  const fetchAppuntamenti = async () => {
    try {
      const response = await axios.get('http://localhost:5000/admin/appuntamenti/passati');
      const now = new Date();
      
      const appuntamentiPassati = response.data
        .filter(app => {
          const appDate = new Date(app.date);
          const [hours, minutes] = app.orario.split(':');
          appDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          return appDate < now;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setAppuntamenti(appuntamentiPassati);
    } catch (error) {
      console.error('Errore nel caricamento degli appuntamenti:', error);
    }
  };

  // Raggruppa gli appuntamenti per data
  const appuntamentiPerData = appuntamenti.reduce((groups, app) => {
    const data = new Date(app.date).toLocaleDateString();
    if (!groups[data]) {
      groups[data] = [];
    }
    groups[data].push(app);
    return groups;
  }, {});

  return (
    <div className="appointments-section fade-in">
      <h2>Appuntamenti Passati</h2>
      {Object.entries(appuntamentiPerData).map(([data, appuntamentiGiorno]) => (
        <div key={data}>
          <h3>{data}</h3>
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Orario</th>
                <th>Cliente</th>
                <th>Servizio</th>
                <th>Operatore</th>
                <th>Stato</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>
              {appuntamentiGiorno
                .sort((a, b) => a.orario.localeCompare(b.orario))
                .map((appuntamento, index) => (
                  <tr key={index}>
                    <td>{new Date(appuntamento.date).toLocaleDateString()}</td>
                    <td>{appuntamento.orario}</td>
                    <td>{appuntamento.nomeCliente}</td>
                    <td>{appuntamento.service?.name || 'N/A'}</td>
                    <td>{appuntamento.operator?.name || 'N/A'}</td>
                    <td style={{ color: appuntamento.stato === 'disdetto' ? '#ff4444' : '#4CAF50' }}>
                      {appuntamento.stato === 'disdetto' ? 'Disdetto' : 'Completato'}
                    </td>
                    <td>{appuntamento.nota}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default AppuntamentiPassati;
