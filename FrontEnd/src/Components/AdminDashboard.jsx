import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppuntamentiAdmin from './AppuntamentiAdmin';
import AppuntamentiPassati from './AppuntamentiPassati';
import AppuntamentiDisdetti from './AppuntamentiDisdetti';
import ServicesManagement from './ServicesManagement';
import OperatorsManagement from './OperatorsManagement';
import SubscriptionManagement from './SubscriptionManagement';
import { FaCalendarAlt, FaHistory, FaUsers, FaSignOutAlt, FaCrown, FaBan, FaCut, FaUserTie, FaCreditCard } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import '../Styles/AdminDashboard.css';
import '../Styles/SubscriptionManagement.css';

const AdminDashboard = () => {
    const [currentView, setCurrentView] = useState('appuntamenti');
    const [users, setUsers] = useState([]);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:5000/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Errore nel recupero degli utenti:', error);
        }
    }, [token, setUsers]); // Aggiungiamo le dipendenze per useCallback

    const handleSetAdmin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/set-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: newAdminEmail })
            });

            if (response.ok) {
                alert('Utente promosso ad admin con successo');
                setNewAdminEmail('');
                fetchUsers();
            } else {
                const error = await response.json();
                alert(error.message);
            }
        } catch (error) {
            console.error('Errore durante la promozione ad admin:', error);
            alert('Errore durante la promozione ad admin');
        }
    };

    // Verifica il parametro success nell'URL e lo stato dell'abbonamento
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('success') === 'true') {
            setShowSuccessMessage(true);
            // Rimuovi il parametro success dall'URL dopo 5 secondi
            setTimeout(() => {
                navigate('/admin', { replace: true });
                setShowSuccessMessage(false);
            }, 5000);
        }

        const checkSubscription = async () => {
            try {
                const response = await fetch('http://localhost:5000/check-admin', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();

                if (!response.ok && data.redirectTo === '/subscribe') {
                    navigate('/subscribe');
                }
            } catch (error) {
                console.error('Errore nella verifica dell\'abbonamento:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSubscription();
    }, [token, navigate, location.search]);

    useEffect(() => {
        // Chiama fetchUsers quando la vista è 'utenti'
        if (currentView === 'utenti') {
            fetchUsers();
        }
    }, [currentView, fetchUsers]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Caricamento...</p>
            </div>
        );
    }

    const pageTransition = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
    };

    return (
        <div className="admin-dashboard">
            {showSuccessMessage && (
                <div className="success-message" style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '15px 25px',
                    borderRadius: '5px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    animation: 'slideIn 0.5s ease-out'
                }}>
                    Abbonamento attivato con successo!
                </div>
            )}
            <motion.div 
                className="sidebar"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <button 
                    className={`sidebar-button ${currentView === 'appuntamenti' ? 'active' : ''}`}
                    onClick={() => setCurrentView('appuntamenti')}
                >
                    <FaCalendarAlt className="button-icon" />
                    <span>Appuntamenti Attuali</span>
                </button>
                <button 
                    className={`sidebar-button ${currentView === 'appuntamenti-passati' ? 'active' : ''}`}
                    onClick={() => setCurrentView('appuntamenti-passati')}
                >
                    <FaHistory className="button-icon" />
                    <span>Appuntamenti Passati</span>
                </button>
                <button 
                    className={`sidebar-button ${currentView === 'appuntamenti-disdetti' ? 'active' : ''}`}
                    onClick={() => setCurrentView('appuntamenti-disdetti')}
                >
                    <FaBan className="button-icon" />
                    <span>Appuntamenti Disdetti</span>
                </button>
                <button 
                    className={`sidebar-button ${currentView === 'servizi' ? 'active' : ''}`}
                    onClick={() => setCurrentView('servizi')}
                >
                    <FaCut className="button-icon" />
                    <span>Gestione Servizi</span>
                </button>
                <button 
                    className={`sidebar-button ${currentView === 'operatori' ? 'active' : ''}`}
                    onClick={() => setCurrentView('operatori')}
                >
                    <FaUserTie className="button-icon" />
                    <span>Gestione Operatori</span>
                </button>
                <button 
                    className={`sidebar-button ${currentView === 'utenti' ? 'active' : ''}`}
                    onClick={() => setCurrentView('utenti')}
                >
                    <FaUsers className="button-icon" />
                    <span>Gestione Utenti</span>
                </button>
                <button 
                    className={`sidebar-button ${currentView === 'abbonamento' ? 'active' : ''}`}
                    onClick={() => setCurrentView('abbonamento')}
                >
                    <FaCreditCard className="button-icon" />
                    <span>Gestione Abbonamento</span>
                </button>
                <button 
                    className="sidebar-button logout-button"
                    onClick={handleLogout}
                >
                    <FaSignOutAlt className="button-icon" />
                    <span>Disconnetti</span>
                </button>
            </motion.div>
            <motion.div 
                className="main-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <AnimatePresence mode="wait">
                    {currentView === 'appuntamenti' && (
                        <motion.div key="appuntamenti" {...pageTransition}>
                            <AppuntamentiAdmin />
                        </motion.div>
                    )}
                    {currentView === 'appuntamenti-passati' && (
                        <motion.div key="appuntamenti-passati" {...pageTransition}>
                            <AppuntamentiPassati />
                        </motion.div>
                    )}
                    {currentView === 'appuntamenti-disdetti' && (
                        <motion.div key="appuntamenti-disdetti" {...pageTransition}>
                            <AppuntamentiDisdetti />
                        </motion.div>
                    )}
                    {currentView === 'servizi' && (
                        <motion.div key="servizi" {...pageTransition}>
                            <ServicesManagement />
                        </motion.div>
                    )}
                    {currentView === 'operatori' && (
                        <motion.div key="operatori" {...pageTransition}>
                            <OperatorsManagement />
                        </motion.div>
                    )}
                    {currentView === 'utenti' && (
                        <motion.div 
                            key="utenti" 
                            className="users-section"
                            {...pageTransition}
                        >
                            <motion.h2
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                Gestione Utenti
                            </motion.h2>
                            
                            <motion.div 
                                className="add-admin-form"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h3>
                                    <FaCrown style={{ marginRight: '10px', color: '#3498db' }} />
                                    Promuovi Utente ad Admin
                                </h3>
                                <form onSubmit={handleSetAdmin}>
                                    <input
                                        type="email"
                                        placeholder="Email utente"
                                        value={newAdminEmail}
                                        onChange={(e) => setNewAdminEmail(e.target.value)}
                                        required
                                    />
                                    <button type="submit">
                                        <FaCrown style={{ marginRight: '8px' }} />
                                        Promuovi ad Admin
                                    </button>
                                </form>
                            </motion.div>

                            <motion.div 
                                className="users-list"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h3>Lista Utenti</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Email</th>
                                            <th>Ruolo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user, index) => (
                                            <motion.tr 
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 * index }}
                                            >
                                                <td>{user.name}</td>
                                                <td>{user.email}</td>
                                                <td>
                                                    {user.role === 'admin' ? (
                                                        <span className="admin-badge">
                                                            <FaCrown style={{ marginRight: '5px', color: '#f1c40f' }} />
                                                            {user.role}
                                                        </span>
                                                    ) : user.role}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </motion.div>
                        </motion.div>
                    )}
                    {currentView === 'abbonamento' && (
                        <motion.div key="abbonamento" {...pageTransition}>
                            <SubscriptionManagement />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default AdminDashboard;
