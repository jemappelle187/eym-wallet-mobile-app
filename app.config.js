// app.config.js
export default {
  expo: {
    name: "sendnreceive",
    slug: "sendnreceive",
    extra: {
      EXPO_PUBLIC_API_BASE: process.env.EXPO_PUBLIC_API_BASE || "http://192.168.178.174:4000",
      EXPO_PUBLIC_WEBHOOK_SECRET: process.env.EXPO_PUBLIC_WEBHOOK_SECRET || "test_shared_secret_please_change"
    }
  }
}



