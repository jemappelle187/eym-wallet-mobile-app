# SendNReceive Mobile App (MVP)

This is the MVP (Minimum Viable Product) of the SendNReceive mobile application, built with React Native and Expo.

## Features

-   **Authentication (Mocked)**: Login and Sign Up functionality.
-   **Dashboard**: View mock balances and access quick actions.
-   **Deposit Funds**: Mock interface for depositing money via various methods.
-   **Withdraw Funds**: Mock interface for withdrawing money.
-   **Send Money**: Mock interface to send money with mock currency conversion.
-   **Receive Money**: Display mock account details for receiving funds.
-   **Pay in Store**: Simulate QR code payment.
-   **Transaction History**: View a list of mock transactions with details.
-   **Profile & Settings**: View mock user profile and access placeholder settings, including a functional logout.
-   **Premium UI**: Features elements of glassmorphism, an African-inspired color palette, and subtle animations.

## Tech Stack

-   React Native (Expo)
-   Expo Go for development and testing
-   `@react-navigation/native` and `@react-navigation/stack` for navigation
-   `expo-blur` for glassmorphism effects
-   `@expo/vector-icons` (Ionicons) for iconography

## Quick Start

These instructions assume you have [Node.js](https://nodejs.org/) installed.

1.  **Install Expo CLI globally** (if you haven't already):
    ```bash
    npm install -g expo-cli
    ```
    *Note: While `npx create-expo-app` is used for project creation, `expo-cli` is still useful for managing projects and is mentioned in the original `appreadme.md`.*

2.  **Navigate to the app directory**:
    If you have cloned the entire repository, the app is located in the `sendnreceive-app` folder.
    ```bash
    cd sendnreceive-app
    ```

3.  **Install dependencies**:
    If not already done (e.g., if you just copied the folder or `node_modules` is missing):
    ```bash
    npm install
    ```

4.  **Run the application**:
    ```bash
    npm start
    ```
    Alternatively, you can use `expo start`. This will open the Expo Developer Tools in your browser.

5.  **Test on your device**:
    *   Download the **Expo Go** app from the App Store (iOS) or Google Play Store (Android).
    *   Scan the QR code displayed in the terminal or browser using the Expo Go app.

This will run the app on your physical device or an emulator/simulator.

## Project Structure

-   `screens/`: Contains all application screen components.
-   `navigation/`: Contains navigators (AuthNavigator, MainNavigator).
-   `assets/`: For static assets like images (though currently only using icons from libraries).
-   `App.js`: The main entry point of the application, handles root navigation logic.
-   `app.json`: Expo configuration file.
-   `package.json`: Project dependencies and scripts.

## Notes for MVP

-   All backend operations are mocked. No actual data is saved or transactions processed.
-   Currency conversion rates are static and for demonstration.
-   QR code scanning is simulated.
-   Illustrations and a custom logo are represented by placeholders or generic icons.
