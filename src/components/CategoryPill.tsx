import { CATEGORY_LABELS, type Category } from "@/lib/validation";

export function CategoryPill({ category }: { category: Category }) {
  return <span className={`pill pill-${category}`}>{CATEGORY_LABELS[category]}</span>;
}
