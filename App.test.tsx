import React from "react";
import { Provider as PaperProvider } from "react-native-paper";
import AutoConvertTestScreen from "./app/screens/AutoConvertTestScreen";

export default function App() {
  return (
    <PaperProvider>
      <AutoConvertTestScreen />
    </PaperProvider>
  );
}




