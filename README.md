# 🌍 Global Mitra

**Connecting Travelers with Local Guides for Authentic Experiences**

Global Mitra is a full stack web application that connects travelers with verified local guides for authentic, safe, and well managed travel experiences. The platform focuses on trip planning, safety awareness, permit handling, and guide discovery, inspired by real travel needs in Nepal and similar regions.

---

## 📌 Overview

Global Mitra helps travelers explore destinations confidently while empowering local guides to offer structured and trusted experiences. Travelers can estimate trips, receive safety alerts, apply for permits, and discover destinations. Guides can manage experiences, bookings, and communication in one platform.

The system is designed with scalability in mind, using a modern React frontend and a Django REST backend backed by SQL Server.

---

## ✨ Features

### For Travelers

* Discover verified local guides by location and expertise
* AI assisted trip cost and duration estimates
* Real time safety alerts for regions
* Online permit application and tracking
* Reviews and ratings for guides and experiences

### For Local Guides

* Create and manage travel experiences
* Manage bookings and availability
* Communicate with travelers
* View performance insights and earnings summary

### General

* Secure JWT based authentication with role based access
* Responsive and mobile friendly UI
* Smooth UI interactions and animations
* Destination explorer with images and highlights

---

## 🛠 Tech Stack

### Frontend

| Technology    | Purpose                    |
| ------------- | -------------------------- |
| React 18      | UI library                 |
| TypeScript    | Type safety                |
| Vite          | Development and build tool |
| Tailwind CSS  | Styling                    |
| Framer Motion | Animations                 |
| Zustand       | State management           |
| Lucide React  | Icons                      |

### Backend

| Technology            | Purpose               |
| --------------------- | --------------------- |
| Django 5.2            | Web framework         |
| Django REST Framework | API development       |
| Simple JWT            | Authentication        |
| mssql-django          | SQL Server backend    |
| PyODBC                | Database connectivity |

### Database and Infrastructure

| Technology      | Purpose             |
| --------------- | ------------------- |
| SQL Server 2022 | Primary database    |
| Docker          | Containerization    |
| Adminer         | Database management |

---

## 📁 Project Structure

### Frontend

```
frontend/
├─ public/                # Static files
├─ src/
│  ├─ assets/             # Images and icons
│  ├─ components/         # Reusable UI components
│  ├─ pages/              # Main pages (Home, Login, Guides, Trips, Safety Alerts)
│  ├─ store/              # Zustand state stores
│  ├─ services/           # API interaction logic
│  ├─ styles/             # Global styles
│  ├─ App.tsx             # Root component
│  └─ main.tsx            # Entry point
├─ package.json
├─ vite.config.ts
└─ tailwind.config.js
```

### Backend

```
backend/
├─ accounts/              # Authentication and user roles
├─ guides/                # Guide profiles and experiences
├─ trips/                 # Trip estimates and bookings
├─ safety/                # Safety alerts and reports
├─ permits/               # Permit applications
├─ core/                  # Shared utilities and settings
├─ manage.py
└─ requirements.txt
```

---

## ⚙ How It Works

1. User opens the React frontend in a browser.
2. User signs up or logs in using JWT based authentication.
3. Travelers browse guides, destinations, and trip planning tools.
4. Frontend sends requests to the Django backend.
5. Backend processes requests, interacts with SQL Server, and returns JSON responses.
6. Frontend renders data in a clean and responsive interface.
7. AI assisted logic provides estimated travel cost and duration where applicable.

---

## 🚀 Installation

### Frontend Setup

```
git clone https://github.com/your-username/global-mitra.git
cd global-mitra/frontend
npm install
npm run dev
```

Access the frontend at:

```
http://localhost:5173
```

### Backend Setup

```
cd global-mitra/backend
python -m venv venv
```

Activate virtual environment

Linux or macOS

```
source venv/bin/activate
```

Windows

```
venv\Scripts\activate
```

Install dependencies and run server

```
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # optional
python manage.py runserver
```

Backend runs at:

```
http://localhost:8000
```

---

## 🔐 Environment Variables

Create a `.env` file in the backend directory to store sensitive values.

Example

```
SECRET_KEY=your_django_secret_key
DEBUG=True
DATABASE_NAME=global_mitra
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_HOST=localhost
DATABASE_PORT=1433
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a new branch

   ```
   git checkout -b feature/your-feature
   ```
3. Commit changes

   ```
   git commit -m "Add new feature"
   ```
4. Push to branch

   ```
   git push origin feature/your-feature
   ```
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👤 Author

**Subash Katwal**

LinkedIn: [https://www.linkedin.com/](https://www.linkedin.com/)

---

© 2026 Global Mitra
