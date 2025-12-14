const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model
const { auth, admin } = require('../middleware/authMiddleware');
const GameResult = require('../models/GameResult');

const JWT_SECRET = process.env.JWT_SECRET;

// --- 1. API ĐĂNG KÝ (REGISTER) ---
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // 1. Kiểm tra đầu vào
    if (!username || !password) {
      return res.status(400).json({ msg: 'Vui lòng nhập đủ tên đăng nhập và mật khẩu' });
    }

    // 2. Kiểm tra xem user đã tồn tại chưa
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'Tên đăng nhập đã tồn tại' });
    }

    // 3. Tạo user mới
    user = new User({
      username,
      password,
      role: role || 'student', // Nếu không cung cấp role, mặc định là student
    });

    // 4. Lưu user vào DB
    await user.save();

    // 5. Trả về thông báo thành công 
    res.status(201).json({ msg: 'Tạo tài khoản thành công! Bạn có thể đăng nhập.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi Server');
  }
});

// 2. API ĐĂNG NHẬP (LOGIN)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Kiểm tra đầu vào
    if (!username || !password) {
      return res.status(400).json({ msg: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    // 2. Tìm user trong DB
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // 3. So sánh mật khẩu
  
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // 4. Tạo JSON Web Token (JWT)
    
    const payload = {
      user: {
        id: user.id, // ID của user trong DB
        role: user.role, // Vai trò (student/admin)
        username: user.username,
        avatar: user.avatar,
      },
    };

    
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1d' }, // Token có hạn 1 ngày
      (err, token) => {
        if (err) throw err;
        // 5. Trả token về cho client (frontend)
        res.json({
          token,
          user: payload.user // Gửi kèm thông tin user để frontend biết ai đang đăng nhập
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi Server');
  }
});

// 3. API LẤY TẤT CẢ USERS (CHO ADMIN) 

router.get('/', [auth, admin], async (req, res) => {
  try {
    
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi Server');
  }
});

// 4. API XÓA USER (CHO ADMIN) 

router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    // 1. Tìm user bằng ID (lấy từ URL)
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'Không tìm thấy người dùng' });
    }

    // 2. Ngăn Admin tự xóa 
    if (user.id === req.user.id) {
      return res.status(400).json({ msg: 'Bạn không thể tự xóa tài khoản của mình' });
    }

    // 3. Xóa user khỏi database
    await user.deleteOne(); 

    res.json({ msg: 'Người dùng đã được xóa' });

  } catch (err) {
    console.error(err.message);
    // Nếu ID không đúng định dạng ObjectId
    if (err.kind === 'ObjectId') {
       return res.status(404).json({ msg: 'Không tìm thấy người dùng' });
    }
    res.status(500).send('Lỗi Server');
  }
});

//  5. API CẬP NHẬT AVATAR 

router.put('/avatar', auth, async (req, res) => {
  try {
    // 1. Lấy tên file avatar từ body (ví dụ: "avatar05.jpg")
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ msg: 'Vui lòng chọn một avatar' });
    }

    // 2. Tìm user trong DB bằng ID từ token (lấy từ middleware 'auth')
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'Không tìm thấy người dùng' });
    }

    // 3. Cập nhật trường 'avatar'
    
    user.avatar = avatar;

    // 4. Lưu lại vào DB
    await user.save();

    // 5. Trả về thông tin user đã cập nhật (trừ password)
    const updatedUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      avatar: user.avatar // Gửi avatar mới về
    };
    
    res.json({ msg: 'Cập nhật avatar thành công', user: updatedUser });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi Server');
  }
});

// 5. API THỐNG KÊ (CHO ADMIN) 
// GET /api/users/stats
// Lấy thống kê (tổng user, tổng lượt chơi)
// Private/Admin
router.get('/stats', [auth, admin], async (req, res) => {
  try {
    // Đếm tổng số user (học sinh)
    const totalUsers = await User.countDocuments({ role: 'student' });
    
    // Đếm tổng số lượt chơi (tất cả bản ghi game)
    const totalGamesPlayed = await GameResult.countDocuments();

    res.json({
      totalUsers,
      totalGamesPlayed,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi Server');
  }
});

module.exports = router;
