import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useReverse = () => {
    const [reverse, setReverse] = useState(false);

    // Cargar el estado de 'reverse' desde AsyncStorage
    useEffect(() => {
        const loadReverseState = async () => {
            try {
                const savedReverse = await AsyncStorage.getItem('reverse');
                if (savedReverse !== null) {
                    setReverse(JSON.parse(savedReverse)); // Si existe, lo asignamos
                }
            } catch (error) {
                console.error('Error loading reverse state from AsyncStorage', error);
            }
        };

        loadReverseState();
    }, []);

    // Guardar el estado de 'reverse' en AsyncStorage
    const saveReverseState = async (newState: boolean) => {
        try {
            await AsyncStorage.setItem('reverse', JSON.stringify(newState)); // Guardamos el estado
        } catch (error) {
            console.error('Error saving reverse state to AsyncStorage', error);
        }
    };

    // Función para alternar el valor de 'reverse' y guardarlo en AsyncStorage
    const toggleReverse = () => {
        const newState = !reverse;
        setReverse(newState); // Actualizamos el estado local
        saveReverseState(newState); // Lo guardamos en AsyncStorage
    };

    return { reverse, toggleReverse };
};

export default useReverse;
