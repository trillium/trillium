#!/usr/bin/env node
// Renders the auto-generated sections of the profile README:
//   <!-- BLOG-POST-LIST:START --> ... <!-- BLOG-POST-LIST:END -->   from data/blog-posts.json
//   <!-- PROJECT-LIST:START -->   ... <!-- PROJECT-LIST:END -->     from data/projects.json
// Also writes BLOG.md (the full post list).
// Run by .github/workflows/sync-profile.yml; safe to run locally: node scripts/generate-readme.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const README = path.join(ROOT, 'README.md');
const BLOG_MD = path.join(ROOT, 'BLOG.md');
const BLOG_DATA = path.join(ROOT, 'data', 'blog-posts.json');
const PROJECT_DATA = path.join(ROOT, 'data', 'projects.json');

const BLOG_LIST_LIMIT = 5;

function replaceBetween(content, marker, replacement) {
  const start = `<!-- ${marker}:START -->`;
  const end = `<!-- ${marker}:END -->`;
  const regex = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!regex.test(content)) {
    throw new Error(`README is missing markers ${start} ... ${end}`);
  }
  return content.replace(regex, `${start}\n${replacement}\n${end}`);
}

// --- Blog ---

function renderBlogList(blogData) {
  return blogData.recentPosts
    .slice(0, BLOG_LIST_LIMIT)
    .map((post) => `- [${post.title}](${post.url}) (${post.date})`)
    .join('\n');
}

function renderBlogMd(blogData) {
  const items = blogData.recentPosts
    .map((post) => {
      const tags = post.tags.length ? `\n  - Tags: ${post.tags.join(', ')}` : '';
      return `- **[${post.title}](${post.url})** (${post.date})\n  - ${post.summary}${tags}`;
    })
    .join('\n\n');

  return [
    '# Latest Blog Posts',
    '',
    '> Auto-synced from [trilliumsmith.com](https://trilliumsmith.com)',
    '',
    items,
    '',
    `[View all ${blogData.totalPosts} blog posts →](https://trilliumsmith.com/blog)`,
    '',
  ].join('\n');
}

// --- Projects ---

function renderStack(stack) {
  return `_Stack_: ${stack.map((s) => `[${s.name}](${s.url})`).join(' | ')}`;
}

function renderImage(image) {
  if (!image) return '';
  const img = `<img width="561" alt="${image.alt}" src="${image.light}">`;
  const picture = image.dark
    ? `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="${image.dark}">\n  ${img}\n </picture>`
    : `<picture>\n  ${img}\n </picture>`;
  return `\n<div align="center">\n<a href="${image.href}">\n ${picture}\n</a>\n</div>\n`;
}

function renderProject(project) {
  const role = project.role && project.role !== 'Creator' ? ` - ${project.role}` : '';
  const links = project.links.map((l) => `<a href="${l.url}">${l.label}</a>`).join(' | ');
  const header = `<h3 align="center">\n <strong>${project.name}</strong>${role} | ${links}\n</h3>`;
  const description = project.description.join('\n\n');

  return [header, renderImage(project.image), description, renderStack(project.stack)]
    .filter(Boolean)
    .join('\n\n');
}

function renderProjectList(projectData) {
  const featured = projectData.projects.filter((p) => p.featured);
  const benched = projectData.projects.filter((p) => !p.featured);
  if (benched.length) {
    console.log(`  (benched, not rendered: ${benched.map((p) => p.id).join(', ')})`);
  }

  const portfolio = renderProject(projectData.portfolio);
  const rest = featured.map(renderProject).join('\n\n---\n\n');

  return [
    portfolio,
    '\n---\n',
    rest,
    '\n_For more examples, please refer to the [Portfolio](https://trilliumsmith.com)_',
  ].join('\n');
}

// --- Main ---

function main() {
  const blogData = JSON.parse(fs.readFileSync(BLOG_DATA, 'utf8'));
  const projectData = JSON.parse(fs.readFileSync(PROJECT_DATA, 'utf8'));

  let readme = fs.readFileSync(README, 'utf8');
  readme = replaceBetween(readme, 'BLOG-POST-LIST', renderBlogList(blogData));
  readme = replaceBetween(readme, 'PROJECT-LIST', renderProjectList(projectData));
  fs.writeFileSync(README, readme);
  console.log('✓ Updated README.md (blog + project sections)');

  fs.writeFileSync(BLOG_MD, renderBlogMd(blogData));
  console.log('✓ Wrote BLOG.md');
}

main();
