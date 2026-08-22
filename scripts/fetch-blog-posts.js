#!/usr/bin/env node
// Fetches blog posts from the trilliumsmith.com RSS feed and writes data/blog-posts.json.
// Run by .github/workflows/sync-profile.yml; safe to run locally: node scripts/fetch-blog-posts.js

const fs = require('fs');
const path = require('path');

const FEED_URL = 'https://trilliumsmith.com/feed.xml';
const OUT_FILE = path.join(__dirname, '..', 'data', 'blog-posts.json');

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
};

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&[a-zA-Z]+;/g, (entity) => ENTITIES[entity] ?? entity);
}

function cleanUrl(url) {
  // The feed occasionally emits doubled slashes in paths (site.com//blog/...)
  return url.replace(/([^:])\/\/+/g, '$1/');
}

async function fetchBlogPosts() {
  console.log(`Fetching blog posts from ${FEED_URL} ...`);

  const response = await fetch(FEED_URL);
  if (!response.ok) {
    throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`);
  }
  const rssText = await response.text();

  const posts = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(rssText)) !== null) {
    const item = match[1];

    const titleMatch = item.match(/<title[^>]*>(.+?)<\/title>/);
    const linkMatch = item.match(/<link[^>]*>(.+?)<\/link>/);
    const descMatch = item.match(/<description[^>]*>([\s\S]+?)<\/description>/);
    const dateMatch = item.match(/<pubDate[^>]*>(.+?)<\/pubDate>/);
    const categoryMatches = item.match(/<category>(.+?)<\/category>/g) || [];

    if (titleMatch && linkMatch && dateMatch) {
      posts.push({
        title: decodeEntities(titleMatch[1]),
        url: cleanUrl(linkMatch[1].trim()),
        summary: descMatch ? decodeEntities(descMatch[1]).trim() : '',
        date: new Date(dateMatch[1]).toISOString().split('T')[0],
        tags: categoryMatches.map((c) => decodeEntities(c.replace(/<\/?category>/g, ''))),
      });
    }
  }

  if (posts.length === 0) {
    throw new Error('Parsed 0 posts from the RSS feed — feed format may have changed.');
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  console.log(`✓ Found ${posts.length} blog posts`);
  return posts;
}

async function main() {
  const posts = await fetchBlogPosts();
  const output = {
    updated: new Date().toISOString(),
    recentPosts: posts.slice(0, 10),
    totalPosts: posts.length,
  };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n');
  console.log(`✓ Wrote ${path.relative(process.cwd(), OUT_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
