import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function RootPage() {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';

  // Simple language detection
  let locale = 'en'; // default

  if (acceptLanguage.includes('ko')) {
    locale = 'ko';
  } else if (acceptLanguage.includes('ja')) {
    locale = 'ja';
  } else if (acceptLanguage.includes('zh-CN') || acceptLanguage.includes('zh-cn')) {
    locale = 'zh-CN';
  } else if (acceptLanguage.includes('zh-TW') || acceptLanguage.includes('zh-tw')) {
    locale = 'zh-TW';
  }

  redirect(`/${locale}`);
}