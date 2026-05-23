const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    ten_dang_nhap: z.string().min(3).max(50),
    mat_khau: z.string().min(8).max(72),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

const changePasswordSchema = z.object({
  body: z.object({
    mat_khau_cu: z.string().min(8).max(72),
    mat_khau_moi: z
      .string()
      .min(8)
      .max(72)
      .regex(/[a-z]/, 'Mật khẩu phải có chữ thường')
      .regex(/[A-Z]/, 'Mật khẩu phải có chữ hoa')
      .regex(/[0-9]/, 'Mật khẩu phải có số')
      .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải có ký tự đặc biệt'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

module.exports = {
  loginSchema,
  changePasswordSchema,
};