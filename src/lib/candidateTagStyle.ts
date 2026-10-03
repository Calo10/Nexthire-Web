const TAG_COLOR_CLASSES = [
  'bg-violet-100 text-violet-800',
  'bg-sky-100 text-sky-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-cyan-100 text-cyan-800',
  'bg-orange-100 text-orange-800',
  'bg-indigo-100 text-indigo-800',
  'bg-teal-100 text-teal-800',
  'bg-fuchsia-100 text-fuchsia-800',
];

export function formatTagLabel(name: string): string {
  return name.trim().toLowerCase();
}

/** Stable color for a tag name. The same name always maps to the same class. */
export function tagColorClass(name: string): string {
  const key = formatTagLabel(name);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return TAG_COLOR_CLASSES[hash % TAG_COLOR_CLASSES.length];
}
