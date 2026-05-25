import type { ClickUpLink } from "@/types/product-map";

export const CLICKUP_BRAND_COLOR = "#7B68EE";

const CLICKUP_URL_REGEX = /^https:\/\/app\.clickup\.com\//;

export function isValidClickUpUrl(url: string): boolean {
  return CLICKUP_URL_REGEX.test(url.trim());
}

export function extractTaskIdFromUrl(url: string): string | null {
  const trimmed = url.trim();
  const pathMatch = trimmed.match(/\/t\/([a-z0-9]+)/i);
  if (pathMatch?.[1]) return pathMatch[1].toLowerCase();
  const queryMatch = trimmed.match(/[?&]t=([a-z0-9]+)/i);
  if (queryMatch?.[1]) return queryMatch[1].toLowerCase();
  return null;
}

export function formatTaskDisplayName(link: ClickUpLink): string {
  if (link.task_name?.trim()) return link.task_name.trim();
  if (link.task_id) return `Task #${link.task_id}`;
  return "Task de ClickUp";
}
