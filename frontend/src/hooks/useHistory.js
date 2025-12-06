import { useState, useEffect } from 'react';

const STORAGE_KEY = 'stria_history';

export const useHistory = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    const saveItem = (item) => {
        const newItem = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            ...item
        };
        const updated = [newItem, ...history];
        setHistory(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return newItem;
    };

    const deleteItem = (id) => {
        const updated = history.filter(item => item.id !== id);
        setHistory(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const getStats = () => {
        return {
            totalProjects: history.length,
            totalPins: history.reduce((acc, item) => acc + (item.nNails || 0), 0),
            totalLines: history.reduce((acc, item) => acc + (item.sequence?.length || 0), 0)
        };
    };

    return { history, saveItem, deleteItem, getStats };
};
