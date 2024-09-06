import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtUtil {
    constructor(
        private readonly jwtService: JwtService) {
    }

    async generateTokenForForgotPassword(payload: any, passwordexpiresIn: any, jwtSecret: any) {
        const plainObject = JSON.parse(JSON.stringify(payload));
        // Generating token
        const token = await this.jwtService.signAsync(plainObject, {
            secret: jwtSecret,
            expiresIn: passwordexpiresIn,
            algorithm: 'HS256',
            // noTimestamp: true,
        });
        return token;
    }
}
