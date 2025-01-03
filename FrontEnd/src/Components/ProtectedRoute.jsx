import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Componente che protegge le rotte admin e gestisce gli stati dell'abbonamento
 * - Verifica se l'utente è admin
 * - Controlla lo stato dell'abbonamento
 * - Reindirizza a /subscribe se l'abbonamento non è attivo
 */
const ProtectedRoute = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const response = await fetch('http://localhost:5000/check-admin', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setIsAdmin(data.isAdmin);
                    setHasActiveSubscription(data.hasActiveSubscription);
                } else {
                    setIsAdmin(false);
                    setHasActiveSubscription(false);
                }
            } catch (error) {
                console.error('Errore nel controllo dello stato admin:', error);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            checkAdminStatus();
        } else {
            setLoading(false);
        }
    }, [token]);

    if (loading) {
        return <div>Caricamento...</div>;
    }

    // Se non c'è token o l'utente non è admin, reindirizza alla home
    if (!token || !isAdmin) {
        return <Navigate to="/" replace />;
    }

    // Gestione degli stati dell'abbonamento
    const currentPath = window.location.pathname;
    
    // Caso 1: L'utente sta cercando di accedere alla pagina di abbonamento
    if (currentPath === '/subscribe') {
        // Permetti l'accesso solo se è admin
        return isAdmin ? children : <Navigate to="/" replace />;
    }
    
    // Caso 2: L'utente sta cercando di accedere ad altre pagine admin
    if (isAdmin && !hasActiveSubscription) {
        // Se non ha un abbonamento attivo, reindirizza a /subscribe
        console.log('Admin senza abbonamento attivo - Reindirizzamento a /subscribe');
        return <Navigate to="/subscribe" replace />;
    }

    // Caso 3: Admin con abbonamento attivo - permetti l'accesso
    return children;
};

export default ProtectedRoute;
