import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert, TouchableOpacity, Pressable, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
    const systemScheme = useColorScheme();
    const [theme] = useState(systemScheme || 'light');
    const [dateTime, setDateTime] = useState(new Date());
    const [address, setAddress] = useState('');
    const [si, setSi] = useState(0);
    const [no, setNo] = useState(0);
    const [interest, setInterest] = useState(0);
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [surveys, setSurveys] = useState<any[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Actualiza el reloj cada segundo
    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Carga encuestas guardadas y estado de la encuesta al iniciar
    useEffect(() => {
        loadStoredData();
    }, []);


    // Guarda los datos de la encuesta en AsyncStorage
    const saveSurvey = async () => {
        const newSurvey = { address, ct: si + no + interest, si, no, interest, additionalInfo, date: dateTime.toLocaleString() };
        let updatedSurveys;

        if (editingIndex !== null) {
            updatedSurveys = [...surveys];
            updatedSurveys[editingIndex] = newSurvey;
            setEditingIndex(null);
        } else {
            updatedSurveys = [...surveys, newSurvey];
        }

        setSurveys(updatedSurveys);
        try {
            await AsyncStorage.setItem('surveys', JSON.stringify(updatedSurveys));
            Alert.alert('Guardado', 'Encuesta guardada exitosamente');
            clearFields();
        } catch (error) {
            console.error('Error saving survey', error);
        }

        // Guardar el estado actual de los campos
        await AsyncStorage.setItem('surveyForm', JSON.stringify({
            address,
            si,
            no,
            interest,
            additionalInfo,
        }));
    };

    // Carga los datos almacenados de las encuestas y el formulario
    const loadStoredData = async () => {
        try {
            const storedSurveys = await AsyncStorage.getItem('surveys');
            if (storedSurveys) {
                setSurveys(JSON.parse(storedSurveys));
            }

            const storedFormData = await AsyncStorage.getItem('surveyForm');
            if (storedFormData) {
                const formData = JSON.parse(storedFormData);
                setAddress(formData.address);
                setSi(formData.si);
                setNo(formData.no);
                setInterest(formData.interest);
                setAdditionalInfo(formData.additionalInfo);
            }
        } catch (error) {
            console.error('Error loading data', error);
        }
    };

    // Edita una encuesta existente
    const editSurvey = (index: number) => {
        const survey = surveys[index];
        setAddress(survey.address);
        setSi(survey.si);
        setNo(survey.no);
        setInterest(survey.interest);
        setAdditionalInfo(survey.additionalInfo);
        setEditingIndex(index);
    };

    // Elimina una encuesta
    const deleteSurvey = (index: number) => {
        Alert.alert('Confirmación', '¿Estás seguro de que deseas eliminar esta encuesta?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                onPress: async () => {
                    const updatedSurveys = surveys.filter((_, i) => i !== index);
                    setSurveys(updatedSurveys);
                    await AsyncStorage.setItem('surveys', JSON.stringify(updatedSurveys));
                    Alert.alert('Eliminado', 'Encuesta eliminada exitosamente');
                },
            },
        ]);
    };

    // Exporta las encuestas a un archivo CSV
    const exportToExcel = async () => {
        const csvHeader = 'Fecha,Dirección,CT,SI,NO,Interés,Información adicional\n';
        const csvRows = surveys.map(s => `${s.date},${s.address},${s.ct},${s.si},${s.no},${s.interest},${s.additionalInfo.replace(/,/g, ' ')}\n`).join('');
        const fileUri = FileSystem.documentDirectory + 'encuestas.csv';
        await FileSystem.writeAsStringAsync(fileUri, csvHeader + csvRows, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(fileUri);
    };

    // Limpia los campos del formulario
    const clearFields = () => {
        setAddress('');
        setSi(0);
        setNo(0);
        setInterest(0);
        setAdditionalInfo('');
        setEditingIndex(null);
    };

    // Componente para los contadores SI/NO/Interés
    const Counter = ({ label, value, setter }: { label: string; value: number; setter: (v: number) => void; }) => (
        <View className="w-[48%] mb-4 bg-white rounded-2xl shadow-md overflow-hidden">
            <View className="flex-row h-20">
                <Pressable onPress={() => value > 0 && setter(value - 1)} className="flex-1 bg-[#FF3737] justify-center items-center">
                    <Ionicons name="remove" size={28} color="white" />
                </Pressable>
                <View className="w-16 bg-white justify-center items-center border-l border-r border-gray-300">
                    <Text className="text-xl font-semibold text-center mt-2">{label}</Text>
                    <Text className="text-2xl font-bold">{value}</Text>
                </View>
                <Pressable onPress={() => setter(value + 1)} className="flex-1 bg-[#34C759] justify-center items-center">
                    <Ionicons name="add" size={28} color="white" />
                </Pressable>
            </View>
        </View>
    );

    // Botón personalizado
    const ButtonCustom = ({
        text,
        onPress,
        variant = 'primary',
        disabled
    }: {
        text: string;
        onPress: () => void;
        variant?: 'primary' | 'outline';
        disabled?: boolean;
    }) => (
        <Pressable
            onPress={onPress}
            className={`p-4 rounded-2xl mb-2 items-center shadow-md ${variant === 'primary'
                ? disabled ? 'bg-zinc-400' : 'bg-[#34C759]'
                : `border border-[#34C759]${disabled ? 'bg-zinc-400' : 'bg-white'}`
                }`}
            disabled={disabled}
        >
            <Text
                className={`${variant === 'primary' ? 'text-white' : 'text-[#34C759]'
                    } text-xl font-semibold`}
            >
                {text}
            </Text>
        </Pressable>
    );

    return (
        <View style={{ display: "flex", flexDirection: "column", flex: 1 }} className={`${theme === "dark" ? "bg-[#333333]" : "bg-[#F7F7F7]"} p-5`}>
            {/* Vista estática (Formulario) */}
            <View style={{ flexGrow: 1 }}>
                <TextInput className={`${theme === "dark" ? "color-[#dfdfdf] bg-[#333333]" : "color-[#333333] bg-[#F7F7F7]"} p-3 rounded mb-2 text-xl`} placeholderTextColor={`${theme !== "dark" ? "#333333" : "#F7F7F7"}`} placeholder="Dirección Postal" value={address} onChangeText={setAddress} />
                <Text className={`${theme === "dark" ? "color-[#dfdfdf]" : "color-[#333333]"} font-bold mb-2 text-2xl`}>Casas tocadas: {si + no + interest}</Text>

                <View className="flex-row flex-wrap justify-between">
                    <Counter label="SI" value={si} setter={setSi} />
                    <Counter label="NO" value={no} setter={setNo} />
                    <Counter label="Interés" value={interest} setter={setInterest} />
                </View>

                <TextInput className="bg-white p-3 rounded h-20 mb-2 text-xl" placeholder="Escribe aquí..." value={additionalInfo} onChangeText={setAdditionalInfo} multiline />

                <ButtonCustom text={editingIndex !== null ? "Actualizar Encuesta" : "Guardar Encuesta"} disabled={!address.length} onPress={saveSurvey} />
                {!!surveys.length && <ButtonCustom text="Exportar a Excel" onPress={exportToExcel} variant="outline" />}
                <Text className={`${theme === "dark" ? "color-[#dfdfdf]" : "color-[#333333]"} font-bold mb-2 text-xl`}>Encuestas Guardadas:</Text>
            </View>

            {/* Lista desplazable de encuestas */}
            <ScrollView style={{ flexGrow: 1, }}>
                {surveys.map((survey, index) => (
                    <View key={index} className="flex-row items-center mb-2">
                        <TouchableOpacity onPress={() => editSurvey(index)} className="flex-1">
                            <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                                <Text className="font-semibold text-sm text-gray-700">{survey.date}</Text>
                                <Text className="text-base text-gray-900">{survey.address}</Text>
                            </View>
                        </TouchableOpacity>
                        <Pressable onPress={() => deleteSurvey(index)} className="bg-red-500 p-2 rounded ml-2">
                            <Ionicons name="trash" size={20} color="white" />
                        </Pressable>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
