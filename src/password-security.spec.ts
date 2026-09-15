import { validate } from 'class-validator';
import { RegisterDto } from './modules/auth/dto/register.dto';
import { ResetPasswordDto, ClaimActivateDto } from './modules/auth/dto/auth.dto';
import { Role } from '@prisma/client';

describe('Password Security Validation (P1-005)', () => {
  describe('RegisterDto', () => {
    it('should reject passwords shorter than 8 characters', async () => {
      const dto = new RegisterDto();
      dto.name = 'Test User';
      dto.email = 'test@example.com';
      dto.password = '1234567'; // 7 chars
      dto.role = Role.STUDENT;

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints?.minLength).toContain('at least 8 characters');
    });

    it('should accept passwords of 8 or more characters', async () => {
      const dto = new RegisterDto();
      dto.name = 'Test User';
      dto.email = 'test@example.com';
      dto.password = '12345678'; // 8 chars
      dto.role = Role.STUDENT;

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeUndefined();
    });
  });

  describe('ResetPasswordDto', () => {
    it('should reject new passwords shorter than 8 characters', async () => {
      const dto = new ResetPasswordDto();
      dto.emailOrMobile = 'test@example.com';
      dto.otp = '123456';
      dto.newPassword = 'short';

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'newPassword');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints?.minLength).toContain('at least 8 characters');
    });

    it('should accept new passwords of 8 or more characters', async () => {
      const dto = new ResetPasswordDto();
      dto.emailOrMobile = 'test@example.com';
      dto.otp = '123456';
      dto.newPassword = 'ValidPassword123';

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'newPassword');
      expect(passwordError).toBeUndefined();
    });
  });

  describe('ClaimActivateDto', () => {
    it('should reject activation passwords shorter than 8 characters', async () => {
      const dto = new ClaimActivateDto();
      dto.userId = 'user-uuid-1';
      dto.otp = '123456';
      dto.newPassword = 'short';

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'newPassword');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints?.minLength).toContain('at least 8 characters');
    });

    it('should accept activation passwords of 8 or more characters', async () => {
      const dto = new ClaimActivateDto();
      dto.userId = 'user-uuid-1';
      dto.otp = '123456';
      dto.newPassword = 'ValidPassword123';

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'newPassword');
      expect(passwordError).toBeUndefined();
    });
  });
});
