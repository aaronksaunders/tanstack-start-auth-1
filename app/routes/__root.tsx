import { Link, Outlet, ScrollRestoration, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Body, Head, Html, Meta, Scripts } from '@tanstack/start';
import * as React from 'react';
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary.js';
import { NotFound } from '~/components/NotFound.js';
import appCss from '~/styles/app.css?url';
import { seo } from '~/utils/seo.js';
import { fetchSessionUser } from './_authed';

/**
 * Defines the root route configuration for the application.
 *
 * @constant
 * @type {object}
 *
 * @property {Function} meta - Returns an array of meta tags for the document head.
 * @property {Function} links - Returns an array of link tags for the document head.
 * @property {Function} beforeLoad - Asynchronously fetches the user from the session and adds it to the context.
 * @property {Function} errorComponent - Renders the error component when an error occurs.
 * @property {Function} notFoundComponent - Renders the component when a route is not found.
 * @property {React.ComponentType} component - The main component for the root route.
 */
export const Route = createRootRoute({
  meta: () => [
    {
      charSet: 'utf-8',
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    ...seo({
      title: 'TanStack Start | Type-Safe, Client-First, Full-Stack React Framework',
      description: `TanStack Start is a type-safe, client-first, full-stack React framework. `,
    }),
  ],
  links: () => [
    { rel: 'stylesheet', href: appCss },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      href: '/favicon-16x16.png',
    },
    { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
    { rel: 'icon', href: '/favicon.ico' },
  ],

  beforeLoad: async () => {
    // get the user from the session and add to context
    const user = await fetchSessionUser();

    return {
      user,
    };
  },
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

/**
 * RootComponent is the main component for the root route.
 * It wraps the content in a RootDocument component and renders
 * an Outlet for nested routes.
 *
 * @returns {JSX.Element} The rendered root component.
 */
function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

/**
 * RootDocument component is responsible for rendering the main structure of the application.
 * It includes the HTML, Head, and Body tags, and provides navigation links and user authentication status.
 *
 * @param {Object} props - The properties object.
 * @param {React.ReactNode} props.children - The child components to be rendered within the body.
 *
 * @returns {JSX.Element} The rendered RootDocument component.
 *
 * @example
 * <RootDocument>
 *   <YourComponent />
 * </RootDocument>
 */
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <Html>
      <Head>
        <Meta />
      </Head>
      <Body>
        {children}
        <ScrollRestoration />
        <TanStackRouterDevtools position='bottom-right' />
        <Scripts />
      </Body>
    </Html>
  );
}
