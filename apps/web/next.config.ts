import createMDX from '@next/mdx';
import type { NextConfig } from 'next';

const config: NextConfig = {};

const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-frontmatter', 'remark-gfm'],
    rehypePlugins: ['rehype-slug', ['rehype-pretty-code', { theme: 'github-dark-dimmed', keepBackground: false }]],
  },
});

export default withMDX(config);
