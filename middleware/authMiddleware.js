const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware 1: Kiểm tra "vé" (token) có hợp lệ không
function auth(req, res, next) {
  // 1. Lấy token từ header của request
  // (Frontend sẽ phải gửi token này, chúng ta sẽ làm sau)
  const token = req.header('x-auth-token');

  // 2. Kiểm tra có token không
  if (!token) {
    return res.status(401).json({ msg: 'Không có token, truy cập bị từ chối' });
  }

  // 3. Xác thực token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // 'decoded' chứa payload (user.id, user.role) mà ta đã tạo lúc login
    
    // 4. Gắn thông tin user vào request để các hàm sau sử dụng
    req.user = decoded.user;
    next(); // Cho phép đi tiếp
  } catch (err) {
    res.status(401).json({ msg: 'Token không hợp lệ' });
  }
}

// Middleware 2: Kiểm tra có phải Admin không
// (Lưu ý: Middleware này phải chạy SAU middleware 'auth')
function admin(req, res, next) {
  // req.user đã được gán từ middleware 'auth'
  if (req.user && req.user.role === 'admin') {
    next(); // Đúng là Admin, cho đi tiếp
  } else {
    res.status(403).json({ msg: 'Truy cập bị từ chối, yêu cầu quyền Admin' });
  }
}

module.exports = { auth, admin };
