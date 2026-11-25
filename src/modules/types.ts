export type AppModule = 'recruitment' | 'core-hr';

export const MODULE_STORAGE_KEY = 'nexthire.activeModule';

export const MODULE_HOME: Record<AppModule, string> = {
  recruitment: '/app/dashboard',
  'core-hr': '/app/hr/dashboard',
};

export function isCoreHrPath(pathname: string): boolean {
  return pathname === '/app/hr' || pathname.startsWith('/app/hr/');
}

export function moduleFromPath(pathname: string): AppModule {
  return isCoreHrPath(pathname) ? 'core-hr' : 'recruitment';
}

export function moduleHomePath(module: AppModule): string {
  return MODULE_HOME[module];
}

export function parseStoredModule(raw: string | null): AppModule | null {
  if (raw === 'recruitment' || raw === 'core-hr') return raw;
  return null;
}
