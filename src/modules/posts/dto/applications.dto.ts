import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ApplyJobDto {
  @ApiProperty({ description: 'Full name of the student applicant' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Contact email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'College / University name' })
  @IsString()
  @IsOptional()
  college?: string;

  @ApiPropertyOptional({ description: 'Course or degree program (e.g. B.Tech)' })
  @IsString()
  @IsOptional()
  course?: string;

  @ApiPropertyOptional({ description: 'Department or Branch (e.g. Computer Science)' })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({ description: 'Expected graduation year' })
  @IsNumber()
  @IsOptional()
  graduationYear?: number;

  @ApiPropertyOptional({ description: 'List of relevant technical skills' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({ description: 'Previous experience or projects description' })
  @IsString()
  @IsOptional()
  experience?: string;

  @ApiPropertyOptional({ description: 'Cover letter or personal note to alumni' })
  @IsString()
  @IsOptional()
  coverLetter?: string;

  @ApiPropertyOptional({ description: 'Base64 encoded string or URL of uploaded resume/CV' })
  @IsString()
  @IsOptional()
  resumeData?: string;

  @ApiPropertyOptional({ description: 'Original filename of uploaded resume' })
  @IsString()
  @IsOptional()
  resumeFileName?: string;
}
