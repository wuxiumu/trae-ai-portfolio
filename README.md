# AI 项目作品集门户 · trae-ai-portfolio

> 纯静态 HTML+CSS+JS 的 AI 项目作品集：卡片网格、分类筛选、本地域名跳转；内置 SEO meta / JSON-LD / `llms.txt`，方便搜索与生成式引擎收录。

**定制：** 微信 **qingbao199101**（备注：作品集门户）｜ [wuxiumu@163.com](mailto:wuxiumu@163.com)

## 事实摘要

- **产品**：零依赖静态作品集门户，用 `projects.js` 加一条即可上新卡片。
- **适合**：独立开发者、工作室、AI 产品矩阵要统一展示与跳转的场景。
- **交付**：首页 + 样式 + 渲染逻辑 + 项目数据；可选 `config.local.js` 映射线上域名。
- **不做**：不是 CMS；不含账号体系与后台编辑器。

## 能交付什么

| 模块 | 说明 |
|---|---|
| 卡片网格 | 分类筛选、状态标签、亮点列表 |
| 项目数据 | `projects.js` 两步加项目（源码可放 `git/`） |
| 本地域名 | `config.local.js`（gitignore）映射线上 URL |
| SEO/GEO | meta / OG / Twitter / JSON-LD / robots / sitemap / llms.txt / noscript 全文 |

## 快速预览

```bash
cd trae-ai-portfolio
php -S 127.0.0.1:8800
# 浏览器打开 http://127.0.0.1:8800
```

## 定制合作（可报价）

- 白标皮肤、品牌色与多语言  
- 对接你们现有 GitHub / 产品线自动生成卡片  
- 落地页与案例详情页扩展  
- 部署到自有域名 + CDN  

## SEO 字段预留（产品页 HTML 统一生成时用）

| 字段 | 用途 |
|---|---|
| `seo_title` | `<title>` / OG title |
| `seo_description` | meta description |
| `canonical_url` | 规范 URL |
| `og_image` | 分享图 |
| `robots` | 如 `index,follow` |
| `json_ld_type` | SoftwareApplication / WebPage / FAQPage |
| `hreflang` | zh-CN / en |
| `site_name` | 白标品牌名 |

> **GEO ≠ 地理定位。** GEO = Generative Engine Optimization（生成式引擎优化）。

## GEO（生成式引擎优化）

### 关键词（中英）

- 中文：AI作品集, 项目门户, 静态作品集, 开发者作品墙, AI项目展示
- English: AI portfolio, project showcase portal, static portfolio site, developer showcase

### FAQ

**Q：需要后端吗？**  
A：不需要。任意静态服务器或 `php -S` 即可。

**Q：怎么加新项目？**  
A：源码放入 `git/项目名/`，在 `projects.js` 加一条对象即可。

**Q：如何定制？**  
A：微信 `qingbao199101`，备注「作品集门户」。

## 定制合作

白标、自动同步卡片、域名部署。加微信备注项目名。

---

## 联系方式

定制、演示或合作：

- 邮箱：[wuxiumu@163.com](mailto:wuxiumu@163.com)
- 微信：**qingbao199101**（添加请备注来意）

### 赞助支持

如果内容对你有帮助，欢迎自愿赞助。

| 微信赞赏码 | 支付宝收款码 |
|---|---|
| ![微信赞赏码](https://chiguashentan-test.oss-cn-beijing.aliyuncs.com/wxprogram/zan/20261002185236_31_227.png) | ![支付宝收款码](https://chiguashentan-test.oss-cn-beijing.aliyuncs.com/wxprogram/zan/20261002185309_32_227.jpg) |

