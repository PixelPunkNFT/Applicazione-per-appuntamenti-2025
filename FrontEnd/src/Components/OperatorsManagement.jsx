import { useState, useEffect } from 'react';
import { FaUserPlus, FaTrash, FaClock, FaPlus, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import '../Styles/OperatorsManagement.css';

const OperatorsManagement = () => {
    const [operators, setOperators] = useState([]);
    const [services, setServices] = useState([]);
    const [newOperatorName, setNewOperatorName] = useState('');
    const [error, setError] = useState('');
    const [selectedOperator, setSelectedOperator] = useState(null);
    const [newService, setNewService] = useState({ service: '', duration: '' });
    const token = localStorage.getItem('token');

    const fetchServices = async () => {
        try {
            const response = await fetch('http://localhost:5000/services', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setServices(data);
            }
        } catch (error) {
            console.error('Errore nel recupero dei servizi:', error);
            setError('Errore nel recupero dei servizi');
        }
    };

    const fetchOperators = async () => {
        try {
            const response = await fetch('http://localhost:5000/operators', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setOperators(data);
            }
        } catch (error) {
            console.error('Errore nel recupero degli operatori:', error);
            setError('Errore nel recupero degli operatori');
        }
    };

    useEffect(() => {
        fetchOperators();
        fetchServices();
    }, []);

    const handleAddOperator = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/operators', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    name: newOperatorName,
                    services: []
                })
            });

            if (response.ok) {
                setNewOperatorName('');
                setError('');
                fetchOperators();
            } else {
                const data = await response.json();
                setError(data.message);
            }
        } catch (error) {
            console.error('Errore nella creazione dell\'operatore:', error);
            setError('Errore nella creazione dell\'operatore');
        }
    };

    const handleAddServiceToOperator = async (operatorId) => {
        if (!newService.service || !newService.duration) {
            setError('Seleziona un servizio e specifica la durata');
            return;
        }

        try {
            const operator = operators.find(op => op._id === operatorId);
            const updatedServices = [
                ...operator.services,
                {
                    service: newService.service,
                    duration: parseInt(newService.duration)
                }
            ];

            const response = await fetch(`http://localhost:5000/operators/${operatorId}/services`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ services: updatedServices })
            });

            if (response.ok) {
                setNewService({ service: '', duration: '' });
                setError('');
                fetchOperators();
            } else {
                const data = await response.json();
                setError(data.message);
            }
        } catch (error) {
            console.error('Errore nell\'aggiunta del servizio:', error);
            setError('Errore nell\'aggiunta del servizio');
        }
    };

    const handleRemoveServiceFromOperator = async (operatorId, serviceIndex) => {
        try {
            const operator = operators.find(op => op._id === operatorId);
            const updatedServices = operator.services.filter((_, index) => index !== serviceIndex);

            const response = await fetch(`http://localhost:5000/operators/${operatorId}/services`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ services: updatedServices })
            });

            if (response.ok) {
                fetchOperators();
            } else {
                const data = await response.json();
                setError(data.message);
            }
        } catch (error) {
            console.error('Errore nella rimozione del servizio:', error);
            setError('Errore nella rimozione del servizio');
        }
    };

    const handleDeleteOperator = async (operatorId) => {
        if (window.confirm('Sei sicuro di voler eliminare questo operatore?')) {
            try {
                const response = await fetch(`http://localhost:5000/operators/${operatorId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    fetchOperators();
                } else {
                    const data = await response.json();
                    setError(data.message);
                }
            } catch (error) {
                console.error('Errore nell\'eliminazione dell\'operatore:', error);
                setError('Errore nell\'eliminazione dell\'operatore');
            }
        }
    };

    return (
        <div className="operators-management">
            <motion.h2
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                Gestione Operatori
            </motion.h2>

            <motion.div
                className="add-operator-form"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <h3>
                    <FaUserPlus style={{ marginRight: '10px' }} />
                    Aggiungi Nuovo Operatore
                </h3>
                <form onSubmit={handleAddOperator}>
                    <input
                        type="text"
                        placeholder="Nome operatore"
                        value={newOperatorName}
                        onChange={(e) => setNewOperatorName(e.target.value)}
                        required
                    />
                    <button type="submit">
                        <FaUserPlus style={{ marginRight: '8px' }} />
                        Aggiungi Operatore
                    </button>
                </form>
                {error && <p className="error-message">{error}</p>}
            </motion.div>

            <motion.div
                className="operators-list"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <h3>Lista Operatori</h3>
                <div className="operators-grid">
                    <AnimatePresence>
                        {operators.map((operator, index) => (
                            <motion.div
                                key={operator._id}
                                className="operator-card"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="operator-info">
                                    <h4>{operator.name}</h4>
                                    <p>Aggiunto il: {new Date(operator.createdAt).toLocaleDateString()}</p>
                                    
                                    <div className="operator-services">
                                        <h5>Servizi:</h5>
                                        {operator.services.map((service, serviceIndex) => (
                                            <div key={serviceIndex} className="service-item">
                                                <span>{service.service.name}</span>
                                                <span className="service-duration">
                                                    <FaClock /> {service.duration} min
                                                </span>
                                                <button
                                                    className="remove-service-button"
                                                    onClick={() => handleRemoveServiceFromOperator(operator._id, serviceIndex)}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ))}
                                        
                                        <div className="add-service-form">
                                            <select
                                                value={newService.service}
                                                onChange={(e) => setNewService({
                                                    ...newService,
                                                    service: e.target.value
                                                })}
                                            >
                                                <option value="">Seleziona servizio</option>
                                                {services.map(service => (
                                                    <option key={service._id} value={service._id}>
                                                        {service.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                placeholder="Durata (min)"
                                                value={newService.duration}
                                                onChange={(e) => setNewService({
                                                    ...newService,
                                                    duration: e.target.value
                                                })}
                                                min="1"
                                            />
                                            <button
                                                className="add-service-button"
                                                onClick={() => handleAddServiceToOperator(operator._id)}
                                            >
                                                <FaPlus /> Aggiungi
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="delete-button"
                                    onClick={() => handleDeleteOperator(operator._id)}
                                >
                                    <FaTrash />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default OperatorsManagement;
