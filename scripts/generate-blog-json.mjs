import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const blogDir = path.resolve(rootDir, 'src/content/blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));

const posts = files.map(file => {
  const contentRaw = fs.readFileSync(path.join(blogDir, file), 'utf-8');
  const match = contentRaw.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]+([\s\S]*)$/);
  if (!match) return null;

  const yaml = match[1];
  const body = match[2].trim();

  const getField = (name) => {
    const lines = yaml.split(/\r?\n/);
    for (const line of lines) {
      const prefix = name + ':';
      if (line.trim().startsWith(prefix)) {
        return line.trim().slice(prefix.length).trim().replace(/^["']|["']$/g, '');
      }
    }
    return '';
  };

  const getArray = (name) => {
    const raw = getField(name);
    if (!raw) return [];
    const inner = raw.replace(/^\[|\]$/g, '');
    return inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  };

  const slug = file.replace(/\.md$/, '');
  return {
    id: slug,
    slug: slug,
    title: getField('title'),
    description: getField('description'),
    pubDate: getField('pubDate') || '2026-11-07',
    author: getField('author') || 'Ana Ferreira',
    image: getField('image') || '/assets/images/Fragrance-Wheel-Master-04.png',
    tags: getArray('tags'),
    visit: getField('visit') || 'https://shopee.com.br/annaferreira81',
    content: body
  };
}).filter(Boolean);

posts.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

const targetPath = path.resolve(rootDir, 'public/data/blog_posts.json');
fs.writeFileSync(targetPath, JSON.stringify(posts, null, 2), 'utf-8');
console.log(`Gerados ${posts.length} posts em ${targetPath}`);
