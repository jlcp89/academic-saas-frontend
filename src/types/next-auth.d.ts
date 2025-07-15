import 'next-auth';
import { User as AppUser } from './index';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: AppUser;
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    user?: AppUser;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    userData?: AppUser;
  }
}