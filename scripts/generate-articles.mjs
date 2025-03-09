// scripts/generate-articles.mjs
import { readdir, stat, readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置参数
const NOTES_ROOT = path.join(__dirname, '../Notes')
const EXCLUDE_DIRS = ['Template'] // 只排除模板目录
const ARTICLE_EXT = '.md'

// 递归扫描目录
async function scanNotesDirectory(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true })
  
  const results = []
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    
    // 跳过排除目录和隐藏文件
    if (EXCLUDE_DIRS.includes(entry.name)) continue
    if (entry.name.startsWith('.')) continue

    if (entry.isDirectory()) {
      results.push(...await scanNotesDirectory(fullPath))
    } 
    else if (entry.isFile() && path.extname(entry.name) === ARTICLE_EXT) {
      results.push(fullPath)
    }
  }
  return results
}

// 处理单个文章文件
async function processArticleFile(filePath) {
  const relativePath = path.relative(NOTES_ROOT, filePath)
  const content = await readFile(filePath, 'utf-8')
  const { data } = matter(content)
  const stats = await stat(filePath)
  const normalizeTags = (tags) => {
    if (!tags) return []
    
    // 处理多格式情况：
    if (Array.isArray(tags)) {
      return [...new Set(tags.filter(t => t && typeof t === 'string'))]
    }
    
    if (typeof tags === 'string') {
      // 支持以下格式：
      // "Summary, Hajimi" -> ["Summary", "Hajimi"]
      // "Summary/Hajimi"  -> ["Summary", "Hajimi"]
      return tags.split(/[,\/]/)
        .map(t => t.trim())
        .filter(t => t)
    }
    
    return []
  }
  return {
    title: data.title || path.basename(filePath, ARTICLE_EXT),
    date: data.date || stats.mtime.toISOString(),
    tags: normalizeTags(data.tags),
    category: path.dirname(relativePath).split(path.sep)[0] || 'Uncategorized',
    // 修改 processArticleFile 中的 url 生成
    url: `/Notes/${relativePath
      .replace(/\\/g, '/')      // 替换 Windows 反斜杠
      .replace(ARTICLE_EXT, '')}`

  }
}

// 主执行函数
async function main() {
  try {
    const mdFiles = await scanNotesDirectory(NOTES_ROOT)
    const articles = await Promise.all(mdFiles.map(processArticleFile))

    const sortedArticles = articles.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )
    
    const outputPath = path.join(__dirname, '../articles.json')
    
    // 新增：自动创建目录
    const outputDir = path.dirname(outputPath)
    await mkdir(outputDir, { recursive: true }) // 创建多级目录
    
    await writeFile(outputPath, JSON.stringify(sortedArticles, null, 2))
    
    console.log(`✅ 成功生成 ${sortedArticles.length} 篇文章列表`)
  } catch (error) {
    console.error('❌ 生成失败:', error)
    process.exit(1)
  }
}


main()