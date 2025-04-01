import { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Card, Text, IconButton, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function App() {
    const [dateTime, setDateTime] = useState(new Date());
    const [address, setAddress] = useState('');
    const [si, setSi] = useState(0);
    const [no, setNo] = useState(0);
    const [ct, setCt] = useState(0);
    const [interest, setInterest] = useState(0);
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [surveys, setSurveys] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setDateTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        loadStoredData();
    }, []);

    const saveSurvey = async () => {
        const newSurvey = { address, si, no, ct, interest, additionalInfo, date: dateTime.toLocaleString() };
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
    };

    const loadStoredData = async () => {
        try {
            const storedSurveys = await AsyncStorage.getItem('surveys');
            if (storedSurveys) {
                setSurveys(JSON.parse(storedSurveys));
            }
        } catch (error) {
            console.error('Error loading data', error);
        }
    };

    const editSurvey = (index) => {
        const survey = surveys[index];
        setAddress(survey.address);
        setSi(survey.si);
        setNo(survey.no);
        setCt(survey.ct);
        setInterest(survey.interest);
        setAdditionalInfo(survey.additionalInfo);
        setEditingIndex(index);
    };

    const deleteSurvey = (index) => {
        Alert.alert(
            'Confirmación',
            '¿Estás seguro de que deseas eliminar esta encuesta?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Eliminar',
                    onPress: () => {
                        const updatedSurveys = surveys.filter((_, i) => i !== index);
                        setSurveys(updatedSurveys);
                        AsyncStorage.setItem('surveys', JSON.stringify(updatedSurveys));
                        Alert.alert('Eliminado', 'Encuesta eliminada exitosamente');
                    },
                },
            ]
        );
    };

    const exportToExcel = async () => {
        const csvHeader = 'Fecha,Dirección,SI,NO,CT,Interés,Información adicional\n';
        const csvRows = surveys.map(survey => `${survey.date},${survey.address},${survey.si},${survey.no},${survey.ct},${survey.interest},${survey.additionalInfo.replace(/,/g, ' ')}\n`).join('');
        const csvContent = csvHeader + csvRows;

        const fileUri = FileSystem.documentDirectory + 'encuestas.csv';
        await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(fileUri);
    };

    const clearFields = () => {
        setAddress('');
        setSi(0);
        setNo(0);
        setCt(0);
        setInterest(0);
        setAdditionalInfo('');
        setEditingIndex(null);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.dateTime}>{dateTime.toLocaleString()}</Text>

            <TextInput
                style={styles.input}
                placeholder="Dirección Postal"
                value={address}
                onChangeText={setAddress}
            />

            <View style={styles.row}>
                {[{ label: 'SI', value: si, setter: setSi }, { label: 'NO', value: no, setter: setNo }, { label: 'CT', value: ct, setter: setCt }, { label: 'Interés', value: interest, setter: setInterest }].map((item, index) => (
                    <Card key={index} style={styles.card}>
                        <Text variant={"headlineSmall"} style={styles.cardTitle}>{item.label}</Text>
                        <View style={styles.buttonContainer}>
                            <IconButton
                                icon="plus"
                                iconColor='white'
                                onPress={() => item.setter(item.value + 1)}
                                style={styles.iconButtonMinus}
                            />
                            <Text style={styles.count}>{item.value}</Text>
                            <IconButton
                                icon="minus"
                                iconColor='white'
                                onPress={() => item.setter(item.value - 1)}
                                style={styles.iconButtonPlus}
                            />
                        </View>
                    </Card>
                ))}
            </View>

            <TextInput
                style={styles.textArea}
                placeholder="Escribe aquí..."
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                multiline
            />

            <Button mode='contained' onPress={saveSurvey} style={{ backgroundColor: "green", margin: 5, }}>{editingIndex !== null ? "Actualizar Encuesta" : "Guardar Encuesta"} </Button>
            <Button mode='outlined' onPress={exportToExcel} textColor='black' style={{ borderColor: "green", margin: 5 }} >Exportar a Excel</Button>

            <Text style={styles.listTitle}>Encuestas Guardadas:</Text>
            {surveys.map((survey, index) => (
                <View key={index} style={styles.surveyCardContainer} >
                    <TouchableOpacity onPress={() => editSurvey(index)} style={styles.surveyCardTouchable}>
                        <Card style={styles.surveyCard} >
                            <Text>{survey.date} - {survey.address}</Text>
                        </Card>
                    </TouchableOpacity>
                    <IconButton
                        iconColor='white'
                        icon="delete"
                        onPress={() => deleteSurvey(index)}
                        style={styles.deleteButton}
                    />
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#FAF3E0',
    },
    dateTime: {
        textAlign: 'right',
        fontSize: 16,
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#FFF',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    card: {
        padding: 10,
        alignItems: 'center',
        width: '48%',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 16,
        textAlign: "center",
        fontWeight: 'bold',
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    count: {
        fontSize: 18,
        marginHorizontal: 10,
    },
    iconButtonMinus: {
        marginHorizontal: 5,
        padding: 10,
        backgroundColor: 'red',
        borderRadius: 5,
    },
    iconButtonPlus: {
        marginHorizontal: 5,
        padding: 10,
        backgroundColor: 'green',
        borderRadius: 5,
    },
    textArea: {
        backgroundColor: '#FFF',
        padding: 10,
        borderRadius: 5,
        height: 100,
        marginBottom: 10,
    },
    listTitle: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: 'bold',
    },
    surveyCardContainer: {
        flexDirection: 'row',
        display: "flex",
        alignItems: 'center',
        marginBottom: 10,
    },
    surveyCardTouchable: {
        flexGrow: 5,
    },
    surveyCard: {
        flexGrow: 1,
        padding: 10,
        marginVertical: 5,
        backgroundColor: '#FFF',
        width: '85%',
    },
    deleteButton: {
        flexGrow: 0.1,
        marginLeft: 10,
        backgroundColor: '#FF4D4D',
        padding: 10,
        borderRadius: 5,
    }
});
