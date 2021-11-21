import React from 'react';
import { Text, Button } from 'react-native';

const RecordingScreen = ({ navigation, route }) => {
  return (
    <>
      <Text>This is Recording Screen {route.params.name}'s screen</Text>

      <Button
        title='Go to Insight Screen'
        onPress={() => navigation.navigate('Insight', { name: 'Jane' })}
      />
    </>
  );
};
export default RecordingScreen;
