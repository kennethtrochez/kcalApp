# **kCalApp**

kCalApp is a mobile nutrition tracking app built to make daily calorie and macro tracking simple, visual, and actually usable. Instead of overwhelming the user with data, the app focuses on a clean interface and quick logging, while still giving meaningful insights into daily nutrition.

This project is being developed as a **full-stack application**, with a **React Native frontend** and a **FastAPI backend** that integrates real-world nutrition data.

---

## **Overview**

The goal of kCalApp is to reduce friction in tracking food intake. Most nutrition apps are either too cluttered or too slow to use consistently. This app focuses on:

- Fast food search and logging  
- Clear macro and calorie breakdowns  
- A visual representation of daily progress  
- Simple navigation between days  

---
## 📱 Screenshots

### Home Dashboard
<p align="center">
  <img src="docs/screenshots/HomeTab.png" width="300"/>
</p>

### Food Log
<p align="center">
  <img src="docs/screenshots/FoodLogTab.png" width="300"/>
</p>

### Calendar Navigation

<p align="center">
  <img src="docs/screenshots/CalendarTab1.png" width="300"/>
  <img src="docs/screenshots/CalendarTab2.png" width="300"/>
</p>

### USDA Food Search
<p align="center">
  <img src="docs/screenshots/USDASearchHome.png" width="300"/>
</p>

### Profile & Goals

<p align="center">
  <img src="docs/screenshots/ProfileTab1.png" width="300"/>
  <img src="docs/screenshots/ProfileTab2.png" width="300"/>
  <img src="docs/screenshots/GoalsScreen.png" width="300"/>
</p>

### Nutrition Scanner

<p align="center">
  <img src="docs/screenshots/ScannerCamera.png" width="300"/>
  <img src="docs/screenshots/ScannerReview1.png" width="300"/>
  <img src="docs/screenshots/ScannerReview2.png" width="300"/>
</p>

## **Tech Stack**

### **Frontend**
- React Native (Expo)  
- TypeScript  
- AsyncStorage (local persistence)  

### **Backend**
- FastAPI (Python)  
- REST API architecture  
- Pydantic for request validation  

### **Data**
- USDA FoodData Central API (nutrition data)  

---

## **Features (Current)**

### **Food Search and Logging**
Users can search for foods using real USDA data. Results are displayed in a dropdown, and selecting an item logs it instantly into the current day.

---

### **Nutrition Label Scanner**
Users can scan a nutrition label using the camera or upload a photo from their gallery. The app extracts nutritional values and allows quick logging with editable fields.

---

### **Nutrition Tracking**
Each logged item contributes to daily totals:

- Calories  
- Protein  
- Carbohydrates  
- Fat  

These totals are updated in real time as new foods are added.

---

### **Visual Macro Breakdown**
The app includes a custom visualization that fills a body silhouette based on calorie intake. The fill is segmented by macros, giving a quick visual sense of where calories are coming from.

---

### **Daily Food Log**
Food entries are stored locally and organized by day. Each entry includes:

- Food name  
- Macro values  
- Timestamp  

---

### **Calendar Navigation**
A horizontal calendar allows users to:

- Scroll through past and future dates  
- View logs from previous days  
- Track consistency over time  

---

### **Manual Input**
Users can manually log meals when a food is not found in the API.

---

### **Water Tracking**
Basic water intake tracking is included to support overall daily health tracking.

---

## **Data Flow (How It Works)**

1. User searches for a food  
2. Frontend sends request to FastAPI backend  
3. Backend queries USDA API and formats the response  
4. User selects a food → details are fetched  
5. App creates a structured log entry  
6. Entry is stored locally using AsyncStorage  
7. UI updates totals and visualization instantly  

---

## **Current Status**

This project is currently **in active development (~70% complete)**.

Current focus areas:
- UI polish (food log layout, spacing, styling)  
- Improving macro visualization accuracy  
- Expanding the user profile system  
- Authentication and cloud sync
  
---

## **Running the Project**

### **Backend**
```bash
cd backend
uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000
```

### **Frontend**
```bash
cd mobile
npx expo start
```

Make sure your frontend is pointing to your **local backend (LAN IP)** when testing on a physical device.
