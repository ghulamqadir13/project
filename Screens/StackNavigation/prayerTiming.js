import React, { useState, useEffect } from 'react';
import { FlatList, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TimingScreen = () => {
  const [todayPrayerTimes, setTodayPrayerTimes] = useState(null);
  const [islamicDate, setIslamicDate] = useState(null);
  const [selectedPrayer, setSelectedPrayer] = useState(null);

  useEffect(() => {
    fetchLocationAndPrayerTimes();
  }, []);

  const fetchLocationAndPrayerTimes = async () => {
    try {
      // Get the last update date from AsyncStorage
      const lastUpdateDate = await AsyncStorage.getItem('lastUpdateDate');
      const storedData = await AsyncStorage.getItem('prayerData');
  
      if (lastUpdateDate) {
        const today = new Date().toISOString().split('T')[0];
        if (today === lastUpdateDate) {
          console.log('Prayer times are up to date. Retrieving from AsyncStorage...');
          if (storedData) {
            const { todayPrayerTimes, islamicDate } = JSON.parse(storedData);
            setTodayPrayerTimes(todayPrayerTimes);
            setIslamicDate(islamicDate);
            return;
          }
        }
      }
  
      // Request permission to access device location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }
  
      // Get current location
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
  
      // Get current month and year
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // January is 0
      const currentYear = now.getFullYear();
  
      // Fetch prayer times using current location, month, and year
      const response = await axios.get(
        `http://api.aladhan.com/v1/calendar/${currentYear}/${currentMonth}?latitude=${latitude}&longitude=${longitude}&method=2`
      );
      const data = response.data.data;
  
      // Filter the data to get today's prayer times
      const today = now.getDate();
      const todayData = data.find((item) => {
        const date = new Date(item.date.timestamp * 1000).getDate();
        return date === today;
      });
  
      // Remove unnecessary prayer times
      const { timings, date } = todayData;
      delete timings.Sunrise;
      delete timings.Sunset;
      delete timings.Imsak;
      delete timings.Midnight;
      delete timings.Firstthird;
      delete timings.Lastthird;
  
      setTodayPrayerTimes({ timings, date });
      setIslamicDate(date.hijri);
  
      // Store prayer data and update the last update date in AsyncStorage
      await AsyncStorage.setItem('prayerData', JSON.stringify({ todayPrayerTimes: { timings, date }, islamicDate: date.hijri }));
      await AsyncStorage.setItem('lastUpdateDate', new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error fetching prayer times:', error);
    }
  };
  
  

  const handlePrayerPress = (prayerName, prayerTime) => {
    setSelectedPrayer({ name: prayerName, time: prayerTime });
  };

  const renderPrayerIcon = (prayerName) => {
    switch (prayerName) {
      case 'Fajr':
        return <MaterialCommunityIcons name="weather-night" size={24} color="black" />;
      case 'Dhuhr':
        return <MaterialCommunityIcons name="weather-sunny" size={24} color="black" />;
      case 'Asr':
        return <MaterialCommunityIcons name="weather-sunny-alert" size={24} color="black" />;
      case 'Maghrib':
        return <MaterialCommunityIcons name="weather-sunset" size={24} color="black" />;
      case 'Isha':
        return <MaterialCommunityIcons name="weather-night" size={24} color="black" />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {selectedPrayer && (
        <View style={styles.selectedPrayer}>
          <Text style={styles.selectedPrayerName}>{selectedPrayer.name}</Text>
          <Text style={styles.selectedPrayerTime}>{selectedPrayer.time}</Text>
        </View>
      )}
      {todayPrayerTimes && islamicDate ? (
        <View style={styles.card}>
          <FlatList
            horizontal
            data={Object.entries(todayPrayerTimes.timings)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.prayerItem}
                onPress={() => handlePrayerPress(item[0], item[1])}
              >
                <View style={styles.iconContainer}>{renderPrayerIcon(item[0])}</View>
                <Text style={styles.prayerTime}>{item[1]}</Text>
                <Text style={styles.prayerName}>{item[0]}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item[0]}
          />
          <View style={styles.dateContainer}>
            <Text style={styles.date}>
              {todayPrayerTimes.date.readable}
            </Text>
            <Text style={styles.islamicDate}>
              {islamicDate.day} {islamicDate.month.en} {islamicDate.year}
            </Text>
          </View>
        </View>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    // backgroundColor: 'yellow',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingBottom: 10,
    paddingTop: 15,
    marginHorizontal: -10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  dateContainer: {
    alignItems: 'center',
  },
  date: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  islamicDate: {
    fontSize: 16,
    color: '#666',
  },
  prayerItem: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: 100,
    width: 100,
  },
  iconContainer: {
    marginBottom: 5,
  },
  prayerTime: {
    // Define styles for prayerTime here
  },
  prayerName: {
    fontSize: 12,
    color: '#666',
  },
  selectedPrayer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  selectedPrayerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedPrayerTime: {
    fontSize: 14,
    color: '#666',
  },
});

export default TimingScreen;