import { Body, Controller, Post, Req } from '@nestjs/common';
import { ProfileService } from './profile.service';
import type { VerifiedUserRequest } from 'src/auth/auth.controller';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('update')
  update(
    @Req() req: VerifiedUserRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.update(req.user.userId, updateProfileDto);
  }
}
