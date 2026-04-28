const i18nConfig = {
  locales: ['sv'],
  defaultLocale: 'sv',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  urlMappingStrategy: 'rewriteDefault' as const,
};

export default i18nConfig;
