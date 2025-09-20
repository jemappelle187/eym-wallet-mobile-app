// app.config.js
export default {
  expo: {
    name: "sendnreceive",
    slug: "sendnreceive",
    ios: {
      bundleIdentifier: "com.jemappelle187.sendnreceive"
    },
    extra: {
      // Circle W3S API Configuration - Will use sandbox in dev, production in prod
      EXPO_PUBLIC_CIRCLE_API_KEY: "TEST_API_KEY:46b7b6c01a71d4f6cffd62ed00c2424e:80678c6a953b4ed5f8440acb6e1a4683",
      EXPO_PUBLIC_WEBHOOK_SECRET: "",
      EXPO_PUBLIC_USE_MOCK_API: "false",
      // Auto-convert API for mobile money (connects to real MTN sandbox)
      EXPO_PUBLIC_AUTO_CONVERT_API_BASE: "http://127.0.0.1:4000",
      // Vercel deployment URL (will be set in Vercel dashboard)
      EXPO_PUBLIC_VERCEL_BACKEND_URL: "https://your-auto-convert-api.vercel.app"
    }
  }
}



