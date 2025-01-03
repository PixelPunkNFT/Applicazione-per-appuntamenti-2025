import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCrown, FaSpinner, FaCalendarAlt, FaCut, FaUsers, FaUsersCog, FaHistory } from 'react-icons/fa';
import '../Styles/Subscribe.css';

const Subscribe = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');

    useEffect(() => {
        // Controlla se l'utente è stato reindirizzato qui a causa di un abbonamento scaduto
        const params = new URLSearchParams(location.search);
        if (params.get('canceled') === 'true') {
            setError('Checkout annullato. Riprova quando vuoi.');
        } else if (location.state?.from) {
            setStatusMessage('Il tuo abbonamento non è più attivo. Rinnova per continuare ad utilizzare le funzionalità admin.');
        }
    }, [location]);

    const handleSubscribe = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:5000/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Errore durante la creazione della sessione di pagamento');
            }

            const { url } = await response.json();
            window.location.href = url; // Reindirizza alla pagina di checkout di Stripe
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="subscribe-container">
            <div className="subscribe-card">
                <div className="subscribe-header">
                    <FaCrown className="crown-icon" />
                    <h1>Abbonamento Admin</h1>
                    {statusMessage && (
                        <div className="status-message">
                            {statusMessage}
                        </div>
                    )}
                </div>
                
                <div className="subscribe-content">
                    <h2>Accesso Completo alla Dashboard Admin</h2>
                    <ul>
                        <li>
                            <div className="feature-icon"><FaCalendarAlt /></div>
                            <div className="feature-text">
                                <strong>Gestione Appuntamenti</strong>
                                Visualizza e gestisci tutti gli appuntamenti del sistema
                            </div>
                        </li>
                        <li>
                            <div className="feature-icon"><FaCut /></div>
                            <div className="feature-text">
                                <strong>Gestione Servizi</strong>
                                Crea, modifica ed elimina i servizi offerti
                            </div>
                        </li>
                        <li>
                            <div className="feature-icon"><FaUsersCog /></div>
                            <div className="feature-text">
                                <strong>Gestione Operatori</strong>
                                Amministra il team di operatori e i loro servizi
                            </div>
                        </li>
                        <li>
                            <div className="feature-icon"><FaUsers /></div>
                            <div className="feature-text">
                                <strong>Gestione Utenti</strong>
                                Supervisiona gli account utente e i loro permessi
                            </div>
                        </li>
                        <li>
                            <div className="feature-icon"><FaHistory /></div>
                            <div className="feature-text">
                                <strong>Storico Completo</strong>
                                Accedi allo storico di tutti gli appuntamenti, inclusi quelli disdetti
                            </div>
                        </li>
                    </ul>

                    <div className="price-section">
                        <span className="price">€9.99</span>
                        <span className="period">/mese</span>
                    </div>

                    <button 
                        className="subscribe-button" 
                        onClick={handleSubscribe}
                        disabled={loading}
                    >
                        {loading ? (
                            <FaSpinner className="spinner" />
                        ) : (
                            'Abbonati Ora'
                        )}
                    </button>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Subscribe;
