import { View, Text, PermissionsAndroid, Alert, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import React, { useState, useEffect } from 'react'
import Geolocation from '@react-native-community/geolocation';
import BackgroundService from 'react-native-background-actions';

interface Response {
  coords: {
    latitude: number,
    longitude: number,
    altitude: number | null,
    accuracy: number,
    altitudeAccuracy: number | null,
    heading: number | null,
    speed: number | null
  },
  timestamp: number
}

interface EResponse {
  code: number;
  message: string;
  PERMISSION_DENIED: number;
  POSITION_UNAVAILABLE: number;
  TIMEOUT: number;
}

const App = () => {
  const [currentLocation, setCurrentLocation] = useState<Response  | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<number | null>(null);
  const [error, setError] = useState<EResponse | null>(null)

  useEffect(() => {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'always',
      enableBackgroundLocationUpdates: true,
      locationProvider: 'auto',
    });

    requestPermission().then(() => {
      try {
        startBackgroundService();
      } catch (e) {
        console.warn(e);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      clearWatch();
    };
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

      const backgroundLocationGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Geo App Background Location',
          message: 'Geo App quer acessar localização em segundo plano',
          buttonNeutral: 'Pergunte Depois',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Permitir',
        }
      )

      if (backgroundLocationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permissão negada', 'Sem permissão para acessar localização em segundo plano.');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const sendLocationToServer = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch('https://your-server-endpoint.com/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          latitude,
          longitude,
        ]),
      });

      const data = await response.json();
      console.log('Server response:', data);
    } catch (error) {
      console.error('Error sending location to server:', error);
    }
  };
  
  const watchPosition = () => {
    try {
        const watchID = Geolocation.watchPosition(
            (position) => {
              console.log('watchPosition', position.coords.altitude, position.coords.latitude);
              setCurrentLocation(position);
              sendLocationToServer(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
              console.log('WatchPosition Error', JSON.stringify(error))
              setError(error);
            },
            {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 0,
              distanceFilter: 0,
            }
          );
          setSubscriptionId(watchID);
    } catch (e) {
        console.warn('WatchPosition Error', e);
    }
  }

  const clearWatch = () => {
    subscriptionId !== null && Geolocation.clearWatch(subscriptionId);
    setSubscriptionId(null);
    setCurrentLocation(null);
    setError(null);
  };

  const startBackgroundService = async () => {
    const sleep = (time: any) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

    const veryIntensiveTask = async (_taskDataArguments: any) => {
      const { delay } = _taskDataArguments;
      await new Promise<void>(async (resolve) => {
        watchPosition(); // Start watching location in background
        while (BackgroundService.isRunning()) {
          console.log('Background service running');
          await sleep(delay);
        }
        resolve();
      });
    };

    const options = {
      taskName: 'LocationTracking',
      taskTitle: 'Tracking Location in Background',
      taskDesc: 'App is tracking location in the background',
      taskIcon: {
          name: 'ic_launcher',
          type: 'mipmap',
      },
      color: '#ff00ff',
      linkingURI: 'yourSchemeHere://chat/jane', // See Deep Linking for more info
      parameters: {
          delay: 300000,
      },
  };

    await BackgroundService.start(veryIntensiveTask, options);
    await BackgroundService.updateNotification({taskDesc: 'App is tracking location in the background'});

    BackgroundService.on('expiration', () => {
      console.log('I am being closed :(');
  });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Coordenadas</Text>
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
    marginBottom: 4
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