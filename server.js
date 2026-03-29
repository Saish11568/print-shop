/**
 * PrintShop Server — Entry Point
 * Thin bootstrapper that mounts routes, initializes Socket.io, and starts the deadline scheduler.
 */
require("dotenv").config();  // MUST BE FIRST

const mongoose = require("mongoose");
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const express = require('express');
// ── Services ──
const socketService = require('./src/services/socket.service');
const deadlineService = require('./src/services/deadline.service');

// ── Middleware ──
const { errorHandler } = require('./src/middleware/errorHandler');

// ── Routes ──
const authRoutes = require('./src/routes/auth.routes');
const classroomRoutes = require('./src/routes/classroom.routes');
const pollRoutes = require('./src/routes/poll.routes');
const orderRoutes = require('./src/routes/order.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');

// ── App Setup ──
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 5000;

// ── MongoDB Connection ──
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ── Global Middleware ──
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

app.get('/debug-routes', (req, res) => {
  res.send("Server is running and routes are mounted");
});

app.post('/api/test-login', (req, res) => {
  res.send("TEST LOGIN WORKING");
});

console.log("Mounting authRoutes at /api");
// ── Mount API Routes ──
app.use('/api', authRoutes);

app.get('/test', (req, res) => {
  res.send("Backend working");
});
app.use('/api/classrooms', classroomRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Server-time endpoint (also on /api for consistency)
app.get('/api/server-time', async (req, res) => {
  try {
    const Poll = require('./src/models/Poll');
    const polls = await Poll.find({ expired: false }).select('id expiresAt title');
    const activePolls = polls.map(p => ({
      id: p.id,
      expiresAt: p.expiresAt,
      title: p.title
    }));
    res.json({ serverTime: Date.now(), polls: activePolls });
  } catch (error) {
    console.error('Error fetching server time:', error);
    res.status(500).json({ error: 'Failed to fetch server time' });
  }
});

// ── 404 handler for API routes ──
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ── Centralized Error Handler ──
app.use(errorHandler);

// ── Initialize Socket.io ──
socketService.init(io);

// ── Start Deadline Scheduler ──
deadlineService.start();

// ── Start Server ──
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`  📁 Database: ${path.join(__dirname, 'db')}`);
  console.log(`  🔐 JWT: Enabled`);
  console.log(`  ⚡ Socket.io: Rooms-based architecture`);
  console.log(`  ⏰ Deadline Scheduler: Active (30s interval)`);
  console.log(`  📦 MVC: controllers / routes / services / middleware\n`);
  console.log("MONGO_URI:", process.env.MONGO_URI);
});