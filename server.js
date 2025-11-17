const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Tải các biến môi trường từ file .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// --- Middlewares (Các phần mềm trung gian) ---
// Cho phép frontend ở domain khác (localhost:3000) gọi API
app.use(cors()); 
// Cho phép server đọc dữ liệu JSON được gửi lên
app.use(express.json()); 

// --- Kết nối Database ---
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully!');

    // Chỉ khởi động server SAU KHI kết nối DB thành công
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); // Thoát ứng dụng nếu không kết nối được DB
  });

// --- API Routes ---
app.use('/api/users', require('./routes/users'));
// --- API Routes ---
app.use('/api/game', require('./routes/game')); 