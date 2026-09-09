import path from "node:path";
import fs from "node:fs";
import { CATEGORIES, type Category } from "@/types/content";

/**
 * 콘텐츠는 모노레포 루트의 `content/`에 있다 (apps/web 밖).
 * scripts/의 생성 파이프라인과 공유하기 위한 배치다.
 */
export const CONTENT_ROOT = path.join(process.cwd(), "..", "..", "content");

export const readMarkdownDir = (dir: string) => {
  const full = path.join(CONTENT_ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".md"))
    .map((file) => ({
      slug: file.replace(/\.md$/, ""),
      raw: fs.readFileSync(path.join(full, file), "utf-8"),
    }));
};

const CATEGORY_SET = new Set<string>(CATEGORIES);

/**
 * 레거시 카테고리를 정규화한다.
 *
 * 기존 데이터에는 `Backend.Spring`, `Infrastructure.CI/CD` 같은 점 표기 하위
 * 카테고리가 1~2편 단위로 파편화되어 있었다. 상위로 흡수하고 세부는 태그로 내린다.
 *
 *   "Backend.Spring" -> { category: "Backend", extraTags: ["spring"] }
 */
export const normalizeCategory = (
  raw: string
): { category: Category; extraTags: string[] } => {
  const [head, ...rest] = raw.split(".");
  const category = CATEGORY_SET.has(head) ? (head as Category) : "Backend";
  const extraTags = rest.flatMap((part) =>
    part.split("/").map((t) => t.trim().toLowerCase()).filter(Boolean)
  );
  return { category, extraTags };
};

export const byDateDesc = <T extends { date: string }>(a: T, b: T) =>
  b.date.localeCompare(a.date);
