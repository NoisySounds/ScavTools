import {
	Injectable,
	ExecutionContext,
	UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Observable } from 'rxjs';

export interface AuthenticatedRequest extends Request {
	user: {
		userId: string;
		email: string;
	};
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	canActivate(
		context: ExecutionContext
	): boolean | Promise<boolean> | Observable<boolean> {
		return super.canActivate(context);
	}

	handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();
		const authHeader = request.headers.authorization;

		// Check if Authorization header is missing
		if (!authHeader) {
			throw new UnauthorizedException('Authorization header is missing');
		}

		// Check if Authorization header format is correct
		if (!authHeader.startsWith('Bearer ')) {
			throw new UnauthorizedException(
				'Invalid authorization header format. Expected: Bearer <token>'
			);
		}

		// Check for JWT validation errors
		if (err || !user) {
			if (info?.name === 'TokenExpiredError') {
				throw new UnauthorizedException('Token has expired');
			}
			if (info?.name === 'JsonWebTokenError') {
				throw new UnauthorizedException('Invalid token');
			}
			if (info?.name === 'NotBeforeError') {
				throw new UnauthorizedException('Token not active');
			}

			throw new UnauthorizedException('Authentication failed');
		}

		return user;
	}
}
