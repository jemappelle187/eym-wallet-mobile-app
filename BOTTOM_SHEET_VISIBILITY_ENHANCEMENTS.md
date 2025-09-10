# Bottom Sheet Visibility Enhancement Options

This document outlines various options to improve the visibility of the bottom sheet title against the BalanceCard background.

## ✅ **Option 1: Enhanced Background & Text Shadows (IMPLEMENTED)**

### **What's Been Applied:**
- **Stronger Blur**: Increased blur intensity from 20 to 40
- **Header Background**: Added solid background layer behind header
- **Text Shadows**: Added subtle shadows to title and subtitle
- **Enhanced Backdrop**: Backdrop opacity at 0.5 for better contrast

### **Benefits:**
- ✅ **Better Contrast**: Solid background ensures text readability
- ✅ **Professional Look**: Subtle shadows add depth
- ✅ **Consistent**: Works across all action types
- ✅ **Performance**: Minimal impact on performance

---

## 🔄 **Option 2: Gradient Header Background**

### **Implementation:**
```javascript
// Add gradient background to header
<LinearGradient
  colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
  style={styles.headerBackground}
/>
```

### **Benefits:**
- **Visual Appeal**: Gradient adds modern look
- **Better Contrast**: Stronger background
- **Brand Consistency**: Can use brand colors

### **Cons:**
- **Complexity**: Requires additional gradient component
- **Performance**: Slight performance impact

---

## 🔄 **Option 3: Floating Header with Card Design**

### **Implementation:**
```javascript
// Make header float above content with card styling
header: {
  margin: 16,
  borderRadius: 16,
  backgroundColor: Colors.cardBackground,
  shadowColor: Colors.shadowDark,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.2,
  shadowRadius: 16,
  elevation: 8,
}
```

### **Benefits:**
- **Clear Separation**: Header clearly separated from content
- **Modern Design**: Card-based design is trendy
- **Excellent Visibility**: No background interference

### **Cons:**
- **Space Usage**: Takes up more vertical space
- **Design Change**: Significant visual change

---

## 🔄 **Option 4: Semi-Transparent Overlay**

### **Implementation:**
```javascript
// Add semi-transparent overlay behind text
<View style={styles.textOverlay}>
  <Text style={styles.actionTitle}>{action?.title}</Text>
</View>

// Styles
textOverlay: {
  backgroundColor: 'rgba(255,255,255,0.9)',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 8,
}
```

### **Benefits:**
- **Targeted Solution**: Only affects text area
- **Minimal Change**: Preserves existing design
- **Flexible**: Can adjust opacity as needed

### **Cons:**
- **Limited Scope**: Only helps text, not overall design
- **Visual Clutter**: May look busy

---

## 🔄 **Option 5: Increased Font Weight & Size**

### **Implementation:**
```javascript
actionTitle: {
  ...Typography.h3,
  color: Colors.textPrimary,
  fontWeight: '900', // Increased from 700
  fontSize: 24, // Increased from default
  textShadowColor: 'rgba(0, 0, 0, 0.15)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 3,
}
```

### **Benefits:**
- **Better Readability**: Larger, bolder text
- **Simple Implementation**: Easy to adjust
- **Universal**: Works for all text elements

### **Cons:**
- **Space Impact**: Larger text takes more space
- **Design Balance**: May affect overall proportions

---

## 🔄 **Option 6: Dark Mode Header**

### **Implementation:**
```javascript
// Dark header with light text
headerBackground: {
  backgroundColor: Colors.textPrimary,
  // or use brand colors
  backgroundColor: Colors.primary,
}

actionTitle: {
  color: Colors.textInverse, // White text
  fontWeight: '700',
}
```

### **Benefits:**
- **Maximum Contrast**: Dark background with light text
- **Brand Integration**: Can use brand colors
- **Modern Look**: Dark headers are trendy

### **Cons:**
- **Design Change**: Significant visual change
- **Accessibility**: Need to ensure contrast ratios

---

## 🔄 **Option 7: Animated Background**

### **Implementation:**
```javascript
// Animate background opacity on open
const [headerOpacity] = useState(new Animated.Value(0));

// In useEffect
Animated.timing(headerOpacity, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
}).start();
```

### **Benefits:**
- **Smooth Transition**: Animated background appearance
- **User Experience**: Feels more polished
- **Attention**: Draws focus to header

### **Cons:**
- **Complexity**: More complex implementation
- **Performance**: Animation overhead

---

## 🎯 **Current Status: Option 1 Implemented**

The current implementation uses **Option 1** with:
- ✅ Enhanced blur intensity (40)
- ✅ Solid header background
- ✅ Text shadows
- ✅ Strong backdrop (0.5 opacity)

## 🚀 **Recommendation**

**Option 1 (Current)** is the best balance of:
- **Effectiveness**: Solves the visibility issue
- **Simplicity**: Minimal code changes
- **Performance**: No significant impact
- **Design**: Maintains existing aesthetic

## 🔧 **Quick Test**

To test the current enhancement:
1. Open the app
2. Tap any action button (Add, Send, Receive, Withdraw)
3. Notice the improved title visibility against the BalanceCard background

## 📝 **Next Steps**

If you want to try other options:
1. **Option 2**: Add gradient background
2. **Option 3**: Implement floating header design
3. **Option 4**: Add text overlay
4. **Option 5**: Increase font weight/size
5. **Option 6**: Dark header design
6. **Option 7**: Animated background

Let me know which option you'd like to implement or if the current enhancement is sufficient!





