# TyreHub - Rasheed Tyres Planet

TyreHub is a full-stack web application built for Rasheed Tyres Planet. It includes a React + Vite frontend and an Express + MongoDB backend with JWT authentication, product catalog APIs, enquiry management, and a basic admin dashboard data endpoint.

## Project Structure

- `backend/` - Express server, Mongoose models, API routes, controllers, middleware, and seed data.
- `frontend/` - React + Vite frontend with Tailwind CSS, pages for Home, About, Services, Tyres, and Contact.
- `Prompt.md` - project requirements.

## Setup Instructions

### Backend (Development)

1. Open a terminal in `backend/`
2. Run `npm install`
3. Create a `.env` file from `.env.example`
4. Start the server:
   - `npm run dev`

### Frontend (Development)

1. Open a terminal in `frontend/`
2. Run `npm install`
3. Start the app:
   - `npm run dev`

### Production Build and Go Live

1. Build the frontend:

```bash
cd frontend
npm install
npm run build
```

2. Install backend dependencies:

```bash
cd ../backend
npm install
```

3. Create a backend `.env` file with production variables:

```env
MONGO_URI=<your-production-mongo-connection-string>
JWT_SECRET=<your-jwt-secret>
NODE_ENV=production
PORT=5000
```

4. Start the backend server:

```bash
npm start
```

5. Open the live app at:

```text
http://localhost:5000
```

The backend will serve the frontend production build from `frontend/dist` in production mode.

## Seed Data

To populate the database with initial users, products, services, and enquiries:

```bash
cd backend
npm run seed
```

## Backend API Endpoints

- `POST /api/auth/register` - Create a new user
- `POST /api/auth/login` - Login and receive JWT
- `GET /api/auth/profile` - Get current user profile (authenticated)
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)
- `GET /api/services` - List services
- `POST /api/services` - Create service (admin)
- `POST /api/enquiries` - Submit new enquiry
 - `POST /api/enquiries` - Submit new enquiry (body: `name`, `phone`, `message`)
- `GET /api/enquiries` - List enquiries (admin)
- `DELETE /api/enquiries/:id` - Delete enquiry (admin)
- `PUT /api/enquiries/:id/resolve` - Mark enquiry resolved (admin)
- `GET /api/admin/stats` - Dashboard statistics (admin)
 - `POST /api/products/:id/image` - Upload product image (admin, multipart form-data `image`)

Notes:
- Uploaded images are served from `/uploads/<filename>`; when using the frontend in development, ensure `VITE_API_BASE_URL` points to the backend so uploaded images resolve correctly.
- The Contact page is wired to the backend and stores enquiries in the database with timestamps.

## Admin Credentials

- Email: `admin@tyrehub.com`
- Password: `admin123`

## Deployment Notes

- Frontend can be deployed to Vercel.
- Backend can be deployed to Render or any Node hosting provider.
- Set `MONGO_URI` and `JWT_SECRET` in production environment variables.

## Notes

- The frontend is currently scaffolding with static page content and can be connected to backend APIs via Axios.
- The backend includes rate limiting, Helmet middleware, and JWT-based route protection for admin routes.
