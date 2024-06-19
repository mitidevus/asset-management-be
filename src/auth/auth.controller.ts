import { GetUser } from './../common/decorators/get-user.decorator';
import { JwtAuthGuard } from './../common/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AuthPayloadDto,
  ChangePasswordDto,
  ChangePasswordFirstTimeDto,
  RefreshTokenDto,
} from './dto';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Cookies } from 'src/common/constants';

@Controller('auth')
@ApiTags('AUTH')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getUser(@Req() req) {
    return req.user;
  }
  @Post('login')
  async login(
    @Body() authPayload: AuthPayloadDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const auth = await this.authService.login(authPayload);
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    res.cookie(Cookies.USER, auth.payload, {
      httpOnly: true,
      expires: oneHourFromNow,
    });
    res.cookie(Cookies.ACCESS_TOKEN, auth.accessToken, {
      httpOnly: true,
      expires: oneHourFromNow,
    });

    return { accessToken: auth?.accessToken, refreshToken: auth?.refreshToken };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  changePassword(
    @GetUser('staffCode') staffCode: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userStaffCode = staffCode;

    return this.authService.changePassword(userStaffCode, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password-first-time')
  async changePasswordFirstTime(
    @GetUser('staffCode') staffCode: string,
    @Body() changePasswordFirstTimeDto: ChangePasswordFirstTimeDto,
    @Res() res: Response,
  ) {
    const userStaffCode = staffCode;
    const userUpdated = await this.authService.changePasswordFirstTime(
      userStaffCode,
      changePasswordFirstTimeDto,
    );
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    res.cookie(Cookies.USER, userUpdated.payload, {
      httpOnly: true,
      expires: oneHourFromNow,
    });
    res.cookie(Cookies.ACCESS_TOKEN, userUpdated.accessToken, {
      httpOnly: true,
      expires: oneHourFromNow,
    });
    return res.json({ message: 'Your password has been changed successfully' });
  }

  @Post('refresh')
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    const refresh = await this.authService.refresh(refreshDto);
    return {
      accessToken: refresh?.accessToken,
      refreshToken: refresh?.refreshToken,
    };
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie(Cookies.ACCESS_TOKEN);
    res.clearCookie(Cookies.USER);

    return res.json({ message: 'Logout successful' });
  }
}
