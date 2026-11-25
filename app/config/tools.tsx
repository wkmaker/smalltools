import type { ReactNode } from 'react';
import {
  CATEGORIES_META,
  ALL_TOOLS_META,
  type Category,
  type ToolMeta,
  type CategoryMetaSection,
} from './tools-meta';
import { CATEGORY_ICONS, TOOL_ICONS } from './tool-icons';

export type { Category, ToolMeta, CategoryMetaSection };
export { CATEGORIES_META, ALL_TOOLS_META, CATEGORY_ICONS, TOOL_ICONS };

export interface Tool extends ToolMeta {
  svg: ReactNode;
}

export interface CategorySection extends Omit<CategoryMetaSection, 'tools'> {
  icon: ReactNode;
  tools: Tool[];
}

export const CATEGORIES: CategorySection[] = CATEGORIES_META.map((cat) => ({
  ...cat,
  icon: CATEGORY_ICONS[cat.id],
  tools: cat.tools.map((tool) => ({
    ...tool,
    svg: TOOL_ICONS[tool.href],
  })),
}));

export const ALL_TOOLS: Tool[] = CATEGORIES.flatMap((c) => c.tools);
