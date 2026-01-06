import { ApiProperty } from '@nestjs/swagger';

export class ApiResponse<T> {
  @ApiProperty()
  status: 'success' | 'error';

  @ApiProperty({ required: false })
  data?: T;

  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty()
  timestamp: string;

  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      status: 'success',
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  static error(errorCode: string, message: string): ApiResponse<null> {
    return {
      status: 'error',
      error: errorCode,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
