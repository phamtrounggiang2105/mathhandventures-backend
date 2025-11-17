const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. Định nghĩa "Khuôn mẫu" (Schema) cho User
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Vui lòng nhập tên đăng nhập'],
    unique: true, // Tên đăng nhập không được trùng
    trim: true, // Xóa khoảng trắng thừa
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: 6, // Mật khẩu cần ít nhất 6 ký tự
  },
  role: {
    type: String,
    enum: ['student', 'admin'], // Chỉ được là 1 trong 2 giá trị này
    default: 'student', // Mặc định là 'student'
  },
  avatar: {
    type: String,
    default: 'avatar01.jpg', // Sẽ dùng một ảnh mặc định
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 2. Mã hóa mật khẩu TRƯỚC KHI lưu vào DB
// Đây là một "hook" (lưỡi câu), nó sẽ tự động chạy trước sự kiện 'save'
UserSchema.pre('save', async function (next) {
  // Chỉ mã hóa nếu mật khẩu được sửa (hoặc tạo mới)
  if (!this.isModified('password')) {
    return next();
  }

  // "Muối" (salt) làm cho mật khẩu an toàn hơn
  const salt = await bcrypt.genSalt(10);
  // Băm (hash) mật khẩu
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 3. Tạo một hàm để KIỂM TRA mật khẩu khi đăng nhập
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 4. "Biên dịch" khuôn mẫu thành một Model
const User = mongoose.model('User', UserSchema);

module.exports = User;
