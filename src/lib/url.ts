export function href(path: string, base: string = import.meta.env.BASE_URL): string {
  const b = base.replace(/\/+$/, '');
  const p = path.replace(/^\/+/, '');
  return p ? `${b}/${p}` : `${b}/`;
}
