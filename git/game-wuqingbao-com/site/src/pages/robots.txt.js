// robots.txt — dynamically generated so the Sitemap + llms.txt URLs
// always match the PUBLIC_SITE being built for.
const SITE = (import.meta.env.SITE || 'https://game.wuqingbao.com').replace(/\/$/, '');

const body = `# robots.txt — H5 Arcade / H5 游戏馆
# We welcome search engines AND AI answer engines: this site is built to be cited.
# Machine-readable site summary lives at /llms.txt.

User-agent: *
Allow: /

# AI / LLM crawlers — explicitly allowed (Generative Engine Optimization)
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /
User-agent: CCBot
Allow: /
User-agent: Amazonbot
Allow: /
User-agent: meta-externalagent
Allow: /

Sitemap: ${SITE}/sitemap.xml
# LLM-friendly overview: ${SITE}/llms.txt
`;

export const GET = () =>
  new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
