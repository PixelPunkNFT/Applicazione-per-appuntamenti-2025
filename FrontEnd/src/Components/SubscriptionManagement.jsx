import React, { useState, useEffect } from 'react';
import { FaSpinner } from 'react-icons/fa';

const SubscriptionManagement = () => {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const response = await fetch('http://localhost:5000/subscription-details', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Errore nel recupero dei dettagli dell\'abbonamento');
                }

                const data = await response.json();
                setSubscription(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, [token]);

    const handleManageSubscription = async () => {
        try {
            const response = await fetch('http://localhost:5000/create-portal-session', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Errore nella creazione della sessione del portale');
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="subscription-loading">
                <FaSpinner className="spinner" />
                <p>Caricamento dettagli abbonamento...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="subscription-error">
                <p>Errore: {error}</p>
            </div>
        );
    }

    return (
        <div className="subscription-management">
            <div className="subscription-header">
                <h2>Gestione Abbonamento</h2>
                <div className="subscription-header-line"></div>
            </div>
            
            {subscription && (
                <div className="subscription-details">
                    <div className="subscription-card">
                        <div className="subscription-card-header">
                            <h3>Dettagli Abbonamento</h3>
                            <div className="subscription-status">
                                <span className={`status-indicator ${subscription.status}`}></span>
                                {subscription.status}
                            </div>
                        </div>
                        <div className="subscription-info">
                            <div className="info-row">
                                <div className="info-label">Piano</div>
                                <div className="info-value">{subscription.plan}</div>
                            </div>
                            <div className="info-divider"></div>
                            <div className="info-row">
                                <div className="info-label">Data di inizio</div>
                                <div className="info-value">{new Date(subscription.current_period_start * 1000).toLocaleDateString()}</div>
                            </div>
                            <div className="info-divider"></div>
                            <div className="info-row">
                                <div className="info-label">Prossimo rinnovo</div>
                                <div className="info-value">{new Date(subscription.current_period_end * 1000).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <button 
                            className="manage-subscription-btn"
                            onClick={handleManageSubscription}
                        >
                            Gestisci Abbonamento
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionManagement;
