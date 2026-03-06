# Retired Job Portal (MERN Stack)

A full-stack **Job Portal Platform designed for retired professionals in India**.  
This platform connects experienced retirees with companies looking for skilled and part-time professionals.

Built using the **MERN Stack (MongoDB, Express, React, Node.js)** with modern tools like **Socket.IO, Razorpay, AI integration, and real-time features**.

---

## 🚀 Features

### User Features
- User registration and login with **JWT authentication**
- Secure password hashing using **bcrypt**
- Profile creation and resume management
- Browse and apply for jobs
- Real-time notifications
- Chat system using **Socket.IO**

### Employer Features
- Post and manage job listings
- View applicants
- Manage job postings
- Communicate with job seekers

### Platform Features
- AI integration using **Groq API**
- Resume handling with **Multer**
- Email notifications using **Nodemailer**
- Payment integration using **Razorpay**
- Automated scheduled tasks using **node-cron**
- PDF generation using **PDFKit**
- Secure authentication with **JWT**

---

# 🛠 Tech Stack

## Frontend
- React
- Vite
- React Router
- Axios
- Zustand (state management)
- GSAP (animations)
- Recharts (analytics & charts)
- React Hot Toast
- Lucide Icons
- Socket.IO Client
- Emoji Picker

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs
- Multer
- Nodemailer
- Razorpay
- Socket.IO
- PDFKit
- Groq AI SDK
- Node Cron

---

# 📂 Project Structure

```
retired-job-portal
│
├── backend
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── middleware
│   ├── utils
│   ├── server.js
│   └── package.json
│
├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   ├── store
│   ├── assets
│   └── package.json
│
└── README.md
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/JugalRaj/retired-job-portal.git
```

```
cd retired-job-portal
```

---

# 🔧 Backend Setup

Navigate to backend folder:

```
cd backend
```

Install dependencies:

```
npm install
```

Create a `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
GROQ_API_KEY=your_groq_key
```

Run backend server:

```
npm run dev
```

Backend runs on:

```
http://localhost:5000
```

---

# 💻 Frontend Setup

Navigate to frontend folder:

```
cd frontend
```

Install dependencies:

```
npm install
```

Run the frontend development server:

```
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# 🔐 Authentication

Authentication is implemented using:

- **JWT Tokens**
- **Password hashing with bcrypt**
- Protected routes
- Secure API middleware

---

# 💳 Payment Integration

The platform integrates **Razorpay** for:

- Employer job posting payments
- Secure transaction handling

---

# 📡 Real-Time Features

Real-time communication powered by:

- **Socket.IO**
- Live chat between employer and job seeker
- Instant notifications

---

# 📄 PDF Generation

**PDFKit** is used to generate:

- Job application reports
- Documents and downloadable records

---

# 🤖 AI Integration

The platform integrates **Groq AI** for advanced features such as:

- Smart responses
- AI assistance
- Future job recommendation enhancements

---

# 📊 Data Visualization

**Recharts** is used for:

- Analytics dashboards
- Job statistics
- Employer insights

---

# 🧑‍💻 Author

**Jugal Raj**

GitHub:  
https://github.com/Jugalrajj

---

# 📜 License

This project is licensed under the **MIT License**.

---

# ⭐ Future Improvements

- Job recommendation AI
- Video interview integration
- Admin dashboard
- Resume scoring system
- Mobile responsive improvements

---

# 🙌 Acknowledgements

Thanks to the open-source community and the technologies that made this project possible:

- React
- Node.js
- MongoDB
- Express
- Razorpay
- Socket.IO
- Groq AI
