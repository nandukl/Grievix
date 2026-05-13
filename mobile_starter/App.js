import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

// To run this:
// 1. npx react-native init GrievixMobile
// 2. npm install react-native-qrcode-svg react-native-svg
// 3. Replace App.js with this content

export default function App() {
    const [complaintText, setComplaintText] = useState('');
    const [submittedId, setSubmittedId] = useState(null);

    const handleSubmit = () => {
        // Mock submission to backend
        const mockId = 'GRV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        setSubmittedId(mockId);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Grievix Mobile</Text>
                <Text style={styles.subtitle}>Report Municipal Issues</Text>

                {!submittedId ? (
                    <View style={styles.form}>
                        <Text style={styles.label}>Describe the issue</Text>
                        <TextInput
                            style={styles.input}
                            multiline
                            numberOfLines={4}
                            placeholder="e.g. Water leak near main street..."
                            value={complaintText}
                            onChangeText={setComplaintText}
                        />
                        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                            <Text style={styles.buttonText}>Submit Complaint</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.successContainer}>
                        <Text style={styles.successEmoji}>✅</Text>
                        <Text style={styles.successTitle}>Complaint Submitted!</Text>
                        <Text style={styles.idLabel}>Tracking ID: {submittedId}</Text>

                        <View style={styles.qrContainer}>
                            <QRCode
                                value={submittedId}
                                size={200}
                                color="#1a3a6d"
                                backgroundColor="white"
                            />
                            <Text style={styles.qrHint}>Scan this code to show status to onsite workers</Text>
                        </View>

                        <TouchableOpacity style={styles.secondaryButton} onPress={() => setSubmittedId(null)}>
                            <Text style={styles.secondaryButtonText}>Back to Form</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a3a6d',
        marginTop: 20,
    },
    subtitle: {
        fontSize: 18,
        color: '#64748b',
        marginBottom: 30,
    },
    form: {
        width: '100%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#1a3a6d',
        padding: 18,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    successContainer: {
        alignItems: 'center',
        width: '100%',
    },
    successEmoji: {
        fontSize: 60,
        marginBottom: 10,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a3a6d',
        marginBottom: 5,
    },
    idLabel: {
        fontSize: 18,
        color: '#64748b',
        marginBottom: 20,
    },
    qrContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    qrHint: {
        marginTop: 15,
        color: '#64748b',
        textAlign: 'center',
        fontSize: 14,
        fontStyle: 'italic',
    },
    secondaryButton: {
        padding: 15,
    },
    secondaryButtonText: {
        color: '#1a3a6d',
        fontSize: 16,
        fontWeight: '600',
    }
});
