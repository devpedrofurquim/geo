import { View, Text, PermissionsAndroid, Alert, Linking, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useState, useEffect } from 'react'
import Geolocation from '@react-native-community/geolocation';

interface Location {
  latitude: number;
  longitude: number;
}

const App = () => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  useEffect(() => {
     // Set configuration for Geolocation
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse', // iOS-only, optional
      enableBackgroundLocationUpdates: true, // iOS-only, optional
      locationProvider: 'auto', // Android-only, optional
    });

    requestPermission().then(() => {
      getCurrentLocation();
    });
  }, []);

  const requestPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Geo App',
          message: 'Geo App quer acessar Localização',
          buttonNeutral: 'Pergunte Depois',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Permitir',
        },
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permissão negada', 'Sem permissão para acessar localização.');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setCurrentLocation({ latitude, longitude });
      },
      error => {
        console.warn('Erro', error.message);
        Alert.alert('Erro', 'Não foi possível obter a localização.');
      }
    );
  };

  const openMaps = async () => {
    if (currentLocation) {
      const { latitude, longitude } = currentLocation;
      const url = `http://maps.google.com/maps?q=${latitude},${longitude}`;
  
      console.log('Attempting to open URL:', url); // Log the URL for debugging
  
      try {
        await Linking.openURL(url);
      } catch (error) {
        console.error('Erro ao abrir o URL:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao tentar abrir o URL.');
      }
    } else {
      Alert.alert('Local não disponível', 'Não há localização atual para mostrar no mapa.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Coordenadas</Text>
      <View style={styles.coordinatesContainer}>
        <Text style={styles.coordinateText}>Latitude: {currentLocation ? currentLocation.latitude.toFixed(6) : 'carregando..'}</Text>
        <Text style={styles.coordinateText}>Longitude: {currentLocation ? currentLocation.longitude.toFixed(6) : 'carregando..'}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={currentLocation ? openMaps : requestPermission}>
        <Text style={styles.buttonText}>{currentLocation ? 'Abrir no Maps' : 'Obter Localização'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  coordinatesContainer: {
    marginBottom: 20,
  },
  coordinateText: {
    fontSize: 18,
    color: '#666',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default App;