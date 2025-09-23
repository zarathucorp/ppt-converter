import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/request';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(en|ko|ja|zh-CN|zh-TW)/:path*']
};