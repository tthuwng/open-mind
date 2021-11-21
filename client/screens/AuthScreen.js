import React from 'react';
import { Button } from 'react-native';

const AuthScreen = ({ navigation }) => {
  return (
    <Button
      title='Go to Recording Screen'
      onPress={() => navigation.navigate('Recording', { name: 'Jane' })}
    />
  );
};

export default AuthScreen;
