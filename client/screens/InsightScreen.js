import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

const InsightScreen = ({ navigation, route }) => {
  return <Text>This is {route.params.name}'s profile</Text>;
};

export default InsightScreen;
