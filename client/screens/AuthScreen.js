import React from "react";
import { Button, Text, Alert } from "react-native";
import { useWeb3React } from "@web3-react/core";
import { injected } from "../components/wallet/connectors";

const AuthScreen = ({ navigation }) => {
  const { active, account, library, connector, activate, deactivate } =
    useWeb3React();

  async function connect() {
    try {
      await activate(injected);
    } catch (ex) {
      console.log(ex);
    }
  }

  async function disconnect() {
    try {
      deactivate();
    } catch (ex) {
      console.log(ex);
    }
  }
  return (
    <>
      <Button
        title="Connect to Metamask"
        onPress={connect}
        className="connectMetamaskButton"
      />
      {active ? (
        <>
          <Text>
            Connected with <b>{account}</b>
          </Text>
          <Button
            title="Go to Recording Screen"
            onPress={() => navigation.navigate("Recording", { name: "Jane" })}
          />
        </>
      ) : (
        <Text>Not connected</Text>
      )}
      <Button title="Disconnect" onPress={disconnect} />
    </>
  );
};

export default AuthScreen;
