const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Định nghĩa Khuôn mẫu cho Kết quả game
const GameResultSchema = new Schema({
  // Liên kết kết quả này với một User cụ thể
  
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Loại game mà người dùng đã chơi
  gameType: {
    type: String,
    required: true,
    // 'enum' giới hạn các giá trị được phép
    enum: ['Học toán', 'Đếm số', 'Jack Sparrow'], 
  },
  
  // Điểm số
  score: {
    type: Number,
    required: true,
    default: 0,
  },
  
  // Phần thưởng 
  trophy: {
    type: String,
    default: null,
  },
  
  // Ngày chơi
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// "Biên dịch" khuôn mẫu thành một Model và xuất nó ra
module.exports = mongoose.model('GameResult', GameResultSchema);
