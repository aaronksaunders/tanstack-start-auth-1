import { createFileRoute, useLoaderData, useRouter } from '@tanstack/react-router';
import { getCurrentUser } from '../_authed';

export const Route = createFileRoute('/_authed/home')({
  component: AuthHomePage,
  loader: async () => {
    const user = await getCurrentUser();

    if (!user) {
      return {
        status: 401,
        redirect: '/',
      };
    }

    return {
      userData: user,
    };
  },
});

function AuthHomePage() {
  // session data is available in the context
  const { user } = Route.useRouteContext();

  // get full user data from loader
  const { userData } = Route.useLoaderData();

  const router = useRouter();

  return (
    <div className='p-2'>
      <h3 className='text-2xl my-4'>Welcome Back, {userData?.first_name}!</h3>
      <div>
        <p>Your role is: {user?.role}</p>
        <p>Your user id is: {user?.id}</p>
        <p>Your email id is: {user?.email}</p>
      </div>
      <div className='mt-6'>
        <button
          className='bg-emerald-500 text-white px-4 py-2 rounded uppercase font-semibold text-sm'
          onClick={() =>
            router.navigate({
              to: '/logout',
            })
          }>
          Logout
        </button>
      </div>
    </div>
  );
}
