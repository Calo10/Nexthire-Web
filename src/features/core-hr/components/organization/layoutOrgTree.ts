/**
 * Pure hierarchical (top-down) tree layout for org charts.
 * Each leaf takes one "slot" of width `nodeWidth + gapX`; a parent is centered above its children.
 * No external layout library is required.
 */

export type LayoutTreeNode = {
  id: string;
  children?: LayoutTreeNode[];
};

export type LayoutOptions = {
  nodeWidth: number;
  nodeHeight: number;
  gapX?: number;
  gapY?: number;
  /** Node ids whose descendants should be hidden. */
  collapsed?: ReadonlySet<string>;
};

export type LayoutResult = {
  /** Top-left position for every visible node. */
  positions: Map<string, { x: number; y: number }>;
  /** Parent -> child pairs for visible nodes. */
  edges: { source: string; target: string }[];
  width: number;
  height: number;
};

export function layoutOrgTree(roots: LayoutTreeNode[], options: LayoutOptions): LayoutResult {
  const { nodeWidth, nodeHeight, gapX = 32, gapY = 72, collapsed } = options;
  const slot = nodeWidth + gapX;
  const positions = new Map<string, { x: number; y: number }>();
  const edges: { source: string; target: string }[] = [];
  const seen = new Set<string>();

  const visibleChildren = (n: LayoutTreeNode): LayoutTreeNode[] =>
    collapsed?.has(n.id) ? [] : (n.children ?? []).filter((c) => !seen.has(c.id));

  // Width (in slots) required by a subtree. Guarded against cycles via `seen`.
  const widths = new Map<string, number>();
  const measure = (n: LayoutTreeNode): number => {
    seen.add(n.id);
    const kids = visibleChildren(n);
    const w = kids.length === 0 ? 1 : kids.reduce((sum, c) => sum + measure(c), 0);
    widths.set(n.id, w);
    return w;
  };

  const place = (n: LayoutTreeNode, left: number, depth: number, placed: Set<string>) => {
    placed.add(n.id);
    const w = widths.get(n.id) ?? 1;
    const x = (left + w / 2) * slot - gapX / 2 - nodeWidth / 2;
    positions.set(n.id, { x, y: depth * (nodeHeight + gapY) });
    const kids = (collapsed?.has(n.id) ? [] : (n.children ?? [])).filter((c) => widths.has(c.id) && !placed.has(c.id));
    let cursor = left;
    for (const c of kids) {
      edges.push({ source: n.id, target: c.id });
      place(c, cursor, depth + 1, placed);
      cursor += widths.get(c.id) ?? 1;
    }
  };

  let totalSlots = 0;
  const placed = new Set<string>();
  const measuredRoots = roots.filter((r) => !seen.has(r.id));
  for (const r of measuredRoots) {
    const w = measure(r);
    place(r, totalSlots, 0, placed);
    totalSlots += w;
  }

  let maxDepth = 0;
  positions.forEach((p) => {
    maxDepth = Math.max(maxDepth, p.y);
  });

  return {
    positions,
    edges,
    width: Math.max(0, totalSlots * slot - gapX),
    height: positions.size === 0 ? 0 : maxDepth + nodeHeight,
  };
}
