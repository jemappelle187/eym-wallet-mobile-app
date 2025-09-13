// app.config.js
export default {
  expo: {
    name: "sendnreceive",
    slug: "sendnreceive",
    ios: {
      bundleIdentifier: "com.jemappelle187.sendnreceive"
    },
    extra: {
      // Circle API Configuration - Force real API, no mock
      EXPO_PUBLIC_API_BASE: "https://api-sandbox.circle.com/v1",
      EXPO_PUBLIC_WEBHOOK_SECRET: "",
      EXPO_PUBLIC_CIRCLE_API_KEY: "TEST_API_KEY:46b7b6c01a71d4f6cffd62ed00c2424e:80678c6a953b4ed5f8440acb6e1a4683",
      EXPO_PUBLIC_CIRCLE_SANDBOX: "true",
      USE_MOCK_API: "false"
    }
  }
}



