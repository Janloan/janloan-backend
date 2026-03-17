import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream, readdirSync, statSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const HOSTNAME = 'https://janloan.com';
const BLOG_DIR = resolve(__dirname, 'client', 'public', 'blog');
const OUTPUT_FILE = resolve(__dirname, 'client', 'public', 'sitemap.xml');

async function generateSitemap() {
  try {
    // Create a stream to write to
    const smStream = new SitemapStream({ hostname: HOSTNAME });
    
    // Core application routes
    const links = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/about', changefreq: 'monthly', priority: 0.8 },
      { url: '/apply-now', changefreq: 'monthly', priority: 0.9 },
      { url: '/eligibility', changefreq: 'monthly', priority: 0.9 },
      { url: '/emi-calculator', changefreq: 'monthly', priority: 0.9 },
      { url: '/blog/index.html', changefreq: 'daily', priority: 0.8 },
    ];

    // Read the blog directory
    try {
      const files = readdirSync(BLOG_DIR);
      
      // Filter for .html files and exclude index.html
      const blogFiles = files.filter(file => {
        const filePath = join(BLOG_DIR, file);
        return file.endsWith('.html') && file !== 'index.html' && statSync(filePath).isFile();
      });

      // Add blog files to links
      blogFiles.forEach(file => {
        links.push({
          url: `/blog/${file}`,
          changefreq: 'weekly',
          priority: 0.7
        });
      });
      
      console.log(`Found ${blogFiles.length} blog posts to include in sitemap.`);
    } catch (err) {
      console.warn(`Warning: Could not read blog directory at ${BLOG_DIR}. Are there any blogs?`);
    }

    // Write links to the stream
    links.forEach(link => smStream.write(link));
    
    // End the stream
    smStream.end();

    // Generate the XML string
    const sitemapOutput = await streamToPromise(smStream);
    
    // Write the output to a file
    const writeStream = createWriteStream(OUTPUT_FILE);
    writeStream.write(sitemapOutput.toString());
    writeStream.end();
    
    console.log(`Sitemap generated successfully at: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();
