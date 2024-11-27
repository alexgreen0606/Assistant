import React from 'react';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';

const Dashboard = () => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      
    </View>
  );
};

export default Dashboard;