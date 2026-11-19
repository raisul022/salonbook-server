# SalonBook Backend API Server

> Production-grade RESTful API server for **SalonBook - Salon Appointment Booking Platform**, built with Node.js, Express, TypeScript, MongoDB with Mongoose, JWT Authentication, and verified Stripe Checkout with Webhook processing.

---

## 📌 Project Overview
SalonBook Server powers the backend operations of the SalonBook platform. It handles role-based authentication (Admin & Customer), service catalog management with search/filter/sorting, appointment scheduling with double-booking prevention, automated billing with Stripe Checkout, and verified asynchronous Stripe webhook notifications.

---

## 🛠️ Technology Stack
- **Runtime & Language:** Node.js, TypeScript
- **Framework:** Express.js
- **Database:** MongoDB Atlas with Mongoose ODM
- **Authentication & Security:** JWT (JSON Web Tokens), bcryptjs, role-based authorization middleware
- **Payment Processing:** Stripe Checkout API & Verified Stripe Webhook Event Listeners
- **Image Upload Integration:** ImgBB API
- **Deployment Platform:** Vercel / Render / Railway

---

## ✨ Key Features
1. **Role-Based Authorization Middleware:**
   - Strict server-side verification separating `admin` and `customer` privileges.
   - Guard against unauthorized access and accounts flagged with `isBlocked: true`.
   - Prevent public registration of admin accounts.
2. **Salon Services Catalog:**
   - Full CRUD operations restricted to administrators.
   - Dynamic searching by service name, category-based filtering, and price-based sorting (`price-asc`, `price-desc`).
   - Active/Inactive status toggle (only active services are bookable and publicly visible).
3. **Appointment Booking & Conflict Engine:**
   - Automated double-booking conflict detection for the same date and time slot.
   - Customers can only view and manage their own appointments.
   - Customers can cancel only `pending` appointments (confirmed or cancelled bookings cannot be revoked by customer).
   - Admin confirmation workflow.
4. **Stripe Payment & Webhook Integration:**
   - Generates customized Stripe Checkout Sessions only for confirmed, unpaid appointments.
   - **Verified Stripe Webhook Handler:** Updates appointment payment status to `paid` and saves immutable transaction records upon `checkout.session.completed` event.
   - Admin is prohibited from manually tampering with payment records.
5. **Admin User Management & Statistics:**
   - Ability to review all registered customers, inspect their appointment history, and toggle block/unblock status.
   - Aggregated business analytics: total appointments, revenue totals, status breakdowns, and category sales distribution.

---

## 📋 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a customer account
- `POST /api/auth/login` - Authenticate with email and password
- `POST /api/auth/google` - Sign in / register via Google OAuth
- `GET /api/auth/me` - Fetch authenticated user profile (Protected)
- `PUT /api/auth/profile` - Update permitted profile details (Protected)

### Services (`/api/services`)
- `GET /api/services` - Get active services (Supports `?search=`, `?category=`, `?sort=`, `?limit=`)
- `GET /api/services/:id` - Get single service details
- `GET /api/services/admin/all` - Get all services including inactive (Admin only)
- `POST /api/services/admin/create` - Create a new salon service (Admin only)
- `PUT /api/services/admin/:id` - Update service details (Admin only)
- `DELETE /api/services/admin/:id` - Delete service (Admin only)
- `PATCH /api/services/admin/:id/toggle-status` - Toggle service active/inactive status (Admin only)

### Appointments (`/api/appointments`)
- `POST /api/appointments` - Submit appointment booking (Customer only)
- `GET /api/appointments/my` - Get logged-in customer's appointments (Customer only)
- `PATCH /api/appointments/:id/cancel` - Cancel a pending appointment (Customer only)
- `GET /api/appointments/admin/all` - Get all appointments (Admin only)
- `PATCH /api/appointments/admin/:id/confirm` - Confirm pending appointment (Admin only)
- `PATCH /api/appointments/admin/:id/cancel` - Cancel appointment (Admin only)
- `GET /api/appointments/:id` - View appointment details (Owner or Admin)

### Payments & Transactions (`/api/payments`)
- `POST /api/payments/create-checkout-session` - Create Stripe Checkout session for confirmed appointment
- `GET /api/payments/verify-session` - Verify payment session fallback (Protected)
- `POST /api/payments/webhook` - Stripe Webhook listener (Verifies raw body signature)
- `GET /api/payments/admin/transactions` - View all financial transactions (Admin only)

### User Management (`/api/users`)
- `GET /api/users/customers` - List all registered customers (Admin only)
- `GET /api/users/customers/:id` - View customer profile and booking history (Admin only)
- `PATCH /api/users/customers/:id/toggle-block` - Block or unblock a customer (Admin only)

### Statistics & Overview (`/api/stats`)
- `GET /api/stats/customer` - Customer dashboard overview counts
- `GET /api/stats/admin` - Admin dashboard summary metrics, revenue, and category distribution

---

## ⚙️ Environment Variables
Create a `.env` file in the root directory following `.env.example`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# Authentication Secrets
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
BETTER_AUTH_SECRET=your_better_auth_secret_key

# Stripe Payment Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Admin Seeding Credentials
ADMIN_NAME="Salon Administrator"
ADMIN_EMAIL="admin@salonbook.com"
ADMIN_PASSWORD="AdminPassword123!"
```

---

## 🚀 How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone <SERVER_REPOSITORY_URL>
   cd salonbook-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Update .env with your MongoDB Atlas URI and Stripe Keys
   ```

4. **Seed initial Admin user & sample Salon Services:**
   ```bash
   npm run seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   The API will be running on `http://localhost:5000`.

---

## 🔗 Repository & Live Deployment Links
- **Client Side Repository:** [https://github.com/raisul022/salonbook-client](https://github.com/raisul022/salonbook-client)
- **Server Side Repository:** [https://github.com/raisul022/salonbook-server](https://github.com/raisul022/salonbook-server)
- **Live Server API:** [https://salonbook-server-m31w.onrender.com/api](https://salonbook-server-m31w.onrender.com/api)
- **Live Website:** [https://salonbook-client.vercel.app](https://salonbook-client.vercel.app)

---

## 🔑 Evaluation Credentials
- **Admin Email:** `admin@salonbook.com`
- **Admin Password:** `AdminPassword123!`
- **Demo Customer Email:** `customer@salonbook.com`
- **Demo Customer Password:** `Customer123!`
