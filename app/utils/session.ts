// app/services/session.server.ts
import { useSession } from 'vinxi/http';
import type { User } from '@prisma/client';

export type SessionUser = {
  email: User['email'];
  role: User['role'];
  id: User['id'];
};

export function useAppSession() {
  return useSession<SessionUser>({
    password: 'ChangeThisBeforeShippingToProdOrYouWillBeFired',
  });
}
