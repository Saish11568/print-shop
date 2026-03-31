# 🖨️ Print Shop Management System

A full-stack web application designed to streamline print shop operations, allowing students to submit print requests and shopkeepers/admins to manage orders efficiently.

---

## 🚀 Features

### 👨‍🎓 Student

* Sign up / Login (Email & Google Sign-In)
* Upload documents for printing
* Select print options (pages, copies, color, etc.)
* Join or leave polls (if enabled)
* Track order status in real-time

### 🧑‍💼 Admin / Shopkeeper

* Dashboard to manage all orders
* Accept / Reject / Complete requests
* View uploaded files
* Monitor user activity
* Poll creation & management

### 🧑‍🏫 Coordinator (Optional)

* Unique key-based login
* Manage polls and participants

---

## 🛠️ Tech Stack

### Frontend

* HTML, CSS, JavaScript
* React (if used)
* Hosted on GitHub Pages

### Backend

* Node.js
* Express.js
* MongoDB Atlas

### Authentication

* JWT (JSON Web Tokens)
* Google OAuth (optional)

---

## 🌐 Live Links

* **Frontend:** https://saish11568.github.io/print-shop/
* **Backend:** https://print-shop-boqx.onrender.com

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/print-shop.git
cd print-shop
```

---

### 2️⃣ Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in backend:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
```

Run backend:

```bash
npm start
```

---

### 3️⃣ Setup Frontend

```bash
cd frontend
npm install
npm start
```

---

## 🔐 Environment Variables

| Variable         | Description                     |
| ---------------- | ------------------------------- |
| MONGO_URI        | MongoDB Atlas connection string |
| JWT_SECRET       | Secret for authentication       |
| GOOGLE_CLIENT_ID | For Google Sign-In              |

---

## 📦 Folder Structure

```
print-shop/
│
├── frontend/
│   ├── src/
│   └── public/
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── server.js
│
└── README.md
```

---

## 🧪 Common Issues & Fixes

### ❌ Invalid Credentials Error

* Check backend URL in frontend
* Ensure `.env` variables are correct

### ❌ Backend not working on other devices

* Check MongoDB Network Access (Allow all IPs: `0.0.0.0/0`)
* Ensure deployed backend URL is used

### ❌ Google Sign-In not working

* Verify Client ID
* Ensure backend token verification is implemented

---

## 📈 Future Improvements

* Payment integration 💳
* File preview before printing 📄
* Notification system 🔔
* Mobile responsive UI 📱

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is open-source and available under the MIT License.

---

## 👨‍💻 Author

**Saish**

---

⭐ If you like this project, give it a star!
