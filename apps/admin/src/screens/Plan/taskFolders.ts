import type { Task, TaskFolder } from '@vallista/content-core';
import type { SelectOption } from '../../components/atoms/Atoms';

export interface TaskTreeNode {
  id: string;
  name: string;
  children: TaskTreeNode[];
  tasks: Task[];
}

const COLLAPSED_KEY = 'bento.plan.inboxCollapsedFolders';

function compareName(a: TaskTreeNode, b: TaskTreeNode): number {
  return a.name.localeCompare(b.name, 'ko');
}

function sortTree(node: TaskTreeNode): void {
  node.children.sort(compareName);
  node.children.forEach(sortTree);
}

export function buildTaskTree(tasks: Task[], folders: TaskFolder[]): TaskTreeNode {
  const root: TaskTreeNode = { id: '', name: '', children: [], tasks: [] };
  const nodes = new Map<string, TaskTreeNode>();
  for (const f of folders) {
    nodes.set(f.id, { id: f.id, name: f.name, children: [], tasks: [] });
  }
  for (const f of folders) {
    const node = nodes.get(f.id);
    if (!node) continue;
    const parent = f.parentId ? nodes.get(f.parentId) : undefined;
    (parent ?? root).children.push(node);
  }
  for (const t of tasks) {
    const node = t.folderId ? nodes.get(t.folderId) : undefined;
    (node ?? root).tasks.push(t);
  }
  sortTree(root);
  return root;
}

export function countTreeTasks(node: TaskTreeNode): number {
  return node.tasks.length + node.children.reduce((sum, c) => sum + countTreeTasks(c), 0);
}

export function folderOptions(folders: TaskFolder[]): SelectOption<string>[] {
  const tree = buildTaskTree([], folders);
  const out: SelectOption<string>[] = [];
  const walk = (node: TaskTreeNode, prefix: string) => {
    for (const child of node.children) {
      const label = prefix ? `${prefix} / ${child.name}` : child.name;
      out.push({ value: child.id, label });
      walk(child, label);
    }
  };
  walk(tree, '');
  return out;
}

export function loadCollapsedFolders(): Set<string> {
  try {
    const raw = window.localStorage.getItem(COLLAPSED_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

export function saveCollapsedFolders(ids: Set<string>): void {
  try {
    window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...ids]));
  } catch {
    // localStorage 불가 환경에서는 접힘 상태를 유지하지 않는다
  }
}
