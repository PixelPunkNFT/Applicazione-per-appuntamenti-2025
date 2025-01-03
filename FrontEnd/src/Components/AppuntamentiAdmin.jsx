import { useState, useEffect } from 'react';
import axios from 'axios';

function AppuntamentiAdmin() {
  const [appuntamenti, setAppuntamenti] = useState([]);
  const [operatorColors, setOperatorColors] = useState({});
  const token = localStorage.getItem('token');

  // Funzione per generare un colore casuale
  const generateColor = () => {
    const colors = [
      '#FFB6C1', // Light Pink
      '#98FB98', // Pale Green
      '#87CEEB', // Sky Blue
      '#DDA0DD', // Plum
      '#F0E68C', // Khaki
      '#E6E6FA', // Lavender
      '#FFE4B5', // Moccasin
      '#B0E0E6', // Powder Blue
      '#FFB347', // Pastel Orange
      '#77DD77'  // Pastel Green
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Carica i colori salvati dal localStorage
  useEffect(() => {
    const savedColors = localStorage.getItem('operatorColors');
    if (savedColors) {
      setOperatorColors(JSON.parse(savedColors));
    }
  }, []);

  // Assegna colori agli operatori
  const assignOperatorColors = (appointments) => {
    const colors = { ...operatorColors };
    let hasNewColors = false;

    appointments.forEach(app => {
      if (app.operator && !colors[app.operator._id]) {
        colors[app.operator._id] = generateColor();
        hasNewColors = true;
      }
    });

    if (hasNewColors) {
      setOperatorColors(colors);
      localStorage.setItem('operatorColors', JSON.stringify(colors));
    }
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchAppuntamenti();
    }
  }, [token]);

  const fetchAppuntamenti = async () => {
    try {
      const response = await axios.get('http://localhost:5000/appuntamenti/admin');
      const now = new Date();
      now.setSeconds(0, 0); // Azzera secondi e millisecondi per un confronto più preciso
      
      const appuntamentiFuturi = response.data
        .filter(app => {
          const appDate = new Date(app.date);
          const [hours, minutes] = app.orario.split(':');
          appDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          return appDate >= now && app.stato === 'attivo';
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setAppuntamenti(appuntamentiFuturi);
      assignOperatorColors(appuntamentiFuturi);
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
      <h2>Prossimi Appuntamenti</h2>
      {Object.entries(appuntamentiPerData).map(([data, appuntamentiGiorno]) => (
        <div key={data}>
          <h3>{data}</h3>
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Orario</th>
                <th>Cliente</th>
                <th>Email</th>
                <th>Servizio</th>
                <th>Operatore</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>
              {appuntamentiGiorno
                .sort((a, b) => a.orario.localeCompare(b.orario))
                .map((appuntamento, index) => (
                  <tr 
                    key={index}
                    style={{
                      backgroundColor: appuntamento.operator ? operatorColors[appuntamento.operator._id] : 'transparent'
                    }}
                  >
                    <td>{appuntamento.orario}</td>
                    <td>{appuntamento.nomeCliente}</td>
                    <td>{appuntamento.email || 'N/A'}</td>
                    <td>{appuntamento.service?.name || 'N/A'}</td>
                    <td>{appuntamento.operator?.name || 'N/A'}</td>
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

export default AppuntamentiAdmin;
