import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

// Can be imported from a shared config
export const locales = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({ locale }) => {
  // If locale is not provided, try to get it from request headers
  let resolvedLocale = locale;
  if (!resolvedLocale) {
    const headersList = await headers();

    // Try to get locale from next-intl middleware header
    const nextIntlLocale = headersList.get('x-next-intl-locale');

    if (nextIntlLocale && locales.includes(nextIntlLocale)) {
      resolvedLocale = nextIntlLocale;
    } else {
      resolvedLocale = defaultLocale;
    }
  }

  // Validate that the resolved locale is valid
  if (!resolvedLocale || !locales.includes(resolvedLocale as any)) {
    resolvedLocale = defaultLocale;
  }

  return {
    messages: (await import(`../messages/${resolvedLocale}.json`)).default,
    locale: resolvedLocale
  };
});