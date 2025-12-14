const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/authMiddleware'); 
const GameResult = require('../models/GameResult'); // Import Model vừa tạo
const User = require('../models/User'); 

// --- 1. API LƯU KẾT QUẢ GAME 
router.post('/save', auth, async (req, res) => {
  try {
    const { gameType, score, trophy } = req.body;
    
    // Lấy userId từ token 
    const userId = req.user.id; 

    // Kiểm tra dữ liệu đầu vào
    if (!gameType || score === undefined) {
      return res.status(400).json({ msg: 'Thiếu thông tin gameType hoặc score' });
    }

    // Tạo một bản ghi kết quả mới
    const newResult = new GameResult({
      userId,
      gameType,
      score,
      trophy: trophy || null, // Nếu frontend không gửi trophy, đặt là null
    });

    // Lưu vào database
    await newResult.save();

    res.status(201).json({ msg: 'Đã lưu kết quả thành công', data: newResult });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi Server');
  }
});

// --- 2. API LẤY LỊCH SỬ CHƠI ---

router.get('/history', auth, async (req, res) => {
  try {
    // Tìm tất cả kết quả game của userId 
    // Sắp xếp theo ngày chơi mới nhất
    const history = await GameResult.find({ userId: req.user.id }).sort({ createdAt: -1 });

    if (!history) {
      return res.status(404).json({ msg: 'Không tìm thấy lịch sử chơi' });
    }

    res.json(history); // Trả về một mảng  chứa các kết quả

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi Server');
  }
});

// --- 3. API LẤY DỮ LIỆU BIỂU ĐỒ (CHO ADMIN) ---

router.get('/stats/popularity', auth, async (req, res) => {
  try {
    // Dùng 'aggregate' (tổng hợp) của MongoDB để nhóm và đếm
    const gameStats = await GameResult.aggregate([
      {
        // Nhóm tất cả bản ghi theo trường 'gameType'
        $group: {
          _id: '$gameType', 
          count: { $sum: 1 } // Đếm số lượng
        }
      }
    ]);

    // Dữ liệu trả về sẽ có dạng:
   
    res.json(gameStats);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi Server');
  }
});

// --- 4. API LẤY DỮ LIỆU BIỂU ĐỒ ĐƯỜNG (CHO ADMIN) ---

router.get('/stats/activity', auth, async (req, res) => {
  try {
    // Lấy ngày của 7 ngày trước
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activity = await GameResult.aggregate([
      {
        // 1. Chỉ lấy các game trong 7 ngày gần nhất
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        // 2. Nhóm các bản ghi theo NGÀY 
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 } // Đếm số lượt chơi trong ngày đó
        }
      },
      {
        // 3. Sắp xếp theo ngày, mới nhất ở cuối
        $sort: { _id: 1 } // 1 = tăng dần (cũ đến mới)
      }
    ]);

    res.json(activity);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi Server');
  }
});

// --- 5. API LẤY ĐIỂM TRUNG BÌNH (CHO ADMIN) ---

router.get('/stats/averages', auth, async (req, res) => {
  try {
    const averages = await GameResult.aggregate([
      {
        // 1. Chỉ lấy game có điểm số (loại bỏ Jack Sparrow)
        $match: {
          gameType: { $in: ['Học toán', 'Đếm số'] }
        }
      },
      {
        // 2. Nhóm theo loại game
        $group: {
          _id: '$gameType', // _id sẽ là 'Học toán', 'Đếm số'
          averageScore: { $avg: '$score' } // Tính điểm trung bình
        }
      }
    ]);

 
    res.json(averages);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi Server');
  }
});

// --- 6. API LẤY LỊCH SỬ CỦA 1 USER CỤ THỂ (CHO ADMIN) ---

router.get('/history/:userId', [auth, admin], async (req, res) => {
  try {
    // Lấy userId từ URL 
    const userId = req.params.userId;

    // Tìm tất cả kết quả game của userId đó
    const history = await GameResult.find({ userId: userId }).sort({ createdAt: -1 });

    if (!history) {
      return res.status(404).json({ msg: 'Không tìm thấy lịch sử chơi cho user này' });
    }

    res.json(history); // Trả về mảng lịch sử

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi Server');
  }
});

module.exports = router;
