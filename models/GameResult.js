const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Định nghĩa "Khuôn mẫu" (Schema) cho Kết quả game
const GameResultSchema = new Schema({
  // Liên kết kết quả này với một User cụ thể
  // 'ref: 'User'' nghĩa là nó sẽ tham chiếu đến ID của một ai đó trong bảng 'User'
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
  
  // Phần thưởng (nếu có, ví dụ: 'Huy hiệu hải tặc nhí')
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
