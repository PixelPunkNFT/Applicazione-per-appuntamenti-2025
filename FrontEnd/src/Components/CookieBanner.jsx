import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../Styles/CookieBanner.css';

/**
 * CookieBanner - Componente per la gestione del consenso dei cookie
 * Gestisce il consenso dell'utente per:
 * - Cookie tecnici (necessari)
 * - Cookie analitici
 * - Cookie di marketing
 */
export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    const consent = localStorage.getItem('cookieConsent');
    return !consent;
  });
  
  const [preferences, setPreferences] = useState({
    technical: true, // Sempre true perché necessari
    analytics: true, // Attivo di default
    marketing: true  // Attivo di default
  });

  const saveCookiesToBackend = async (consent) => {
    try {
      const cookieData = {
        technical: consent.technical,
        analytics: consent.analytics,
        marketing: consent.marketing,
        timestamp: consent.timestamp || new Date().toISOString()
      };

      console.log('Tentativo di invio cookie al backend:', cookieData);

      // Verifica connessione al backend
      try {
        await fetch('http://localhost:5000/ping');
      } catch (error) {
        throw new Error('Backend non raggiungibile. Verificare che il server sia in esecuzione.');
      }

      const response = await fetch('http://localhost:5000/cookies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(cookieData)
      });

      console.log('Risposta ricevuta dal server:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Errore dal server: ${errorData.message || 'Errore sconosciuto'}`);
      }

      const data = await response.json();
      console.log('Cookie salvati con successo nel database:', data);

      // Salva in localStorage solo dopo il successo del salvataggio nel database
      localStorage.setItem('cookieConsent', JSON.stringify(cookieData));
    } catch (error) {
      console.error('Errore dettagliato nel salvataggio dei cookie:', error);
      console.error('Stack trace:', error.stack);
      
      // In caso di errore, salviamo comunque in localStorage
      localStorage.setItem('cookieConsent', JSON.stringify({
        technical: consent.technical,
        analytics: consent.analytics,
        marketing: consent.marketing,
        timestamp: new Date().toISOString(),
        error: error.message // Salviamo anche l'errore per debug
      }));
      
      // Rilancia l'errore per gestirlo nel componente
      throw error;
    }
  };

  const handleAcceptAll = async () => {
    try {
      const consent = {
        technical: true,
        analytics: true,
        marketing: true,
        timestamp: new Date().toISOString()
      };
      
      await saveCookiesToBackend(consent);
      console.log('Preferenze cookie salvate con successo');
      setIsVisible(false);
    } catch (error) {
      console.error('Errore nel salvataggio delle preferenze:', error);
      // Mostra un alert all'utente
      alert('Si è verificato un errore nel salvataggio delle preferenze dei cookie. I cookie sono stati salvati localmente ma potrebbero non essere sincronizzati con il server.');
      setIsVisible(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      const consent = {
        ...preferences,
        timestamp: new Date().toISOString()
      };
      
      await saveCookiesToBackend(consent);
      console.log('Preferenze cookie salvate con successo');
      setIsVisible(false);
    } catch (error) {
      console.error('Errore nel salvataggio delle preferenze:', error);
      // Mostra un alert all'utente
      alert('Si è verificato un errore nel salvataggio delle preferenze dei cookie. I cookie sono stati salvati localmente ma potrebbero non essere sincronizzati con il server.');
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-banner-container">
        <div className="cookie-content">
          <h3>La tua privacy è importante</h3>
          <p>
            Utilizziamo i cookie per migliorare la tua esperienza sul nostro sito. Alcuni cookie sono necessari per il funzionamento del sito, mentre altri ci aiutano a migliorare le prestazioni e l'esperienza utente.
          </p>
          
          <div className="cookie-options">
            <div className="cookie-option">
              <input
                type="checkbox"
                checked={preferences.technical}
                disabled
              />
              <label>
                Cookie tecnici (necessari)
              </label>
            </div>
            
            <div className="cookie-option">
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  analytics: e.target.checked
                }))}
              />
              <label>
                Cookie analitici (per migliorare le prestazioni)
              </label>
            </div>
            
            <div className="cookie-option">
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  marketing: e.target.checked
                }))}
              />
              <label>
                Cookie di marketing (per pubblicità personalizzata)
              </label>
            </div>
          </div>

          <div className="cookie-actions">
            <Link 
              to="/privacy-policy"
              className="cookie-link"
            >
              Leggi l'informativa completa
            </Link>
            
            <button
              onClick={handleSavePreferences}
              className="cookie-button cookie-button-save"
            >
              Salva preferenze
            </button>
            
            <button
              onClick={handleAcceptAll}
              className="cookie-button cookie-button-accept"
            >
              Accetta tutti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
