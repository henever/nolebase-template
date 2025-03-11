<!-- .vitepress/theme/ArticlesList.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'

const articles = ref([])
const loading = ref(true)
const error = ref(null)

// 新增颜色映射
const TAG_COLORS = {
  Summary: '#00FA9A',
  Hajimi: '#10b981',
  default: '#6495ED'
}

const loadArticles = async () => {
  try {
    const base = import.meta.env.BASE_URL
    const res = await fetch(`${import.meta.env.BASE_URL}articles.json`)
    if (!res.ok) throw new Error(`加载失败，状态码: ${res.status}`)
    articles.value = await res.json()
    error.value = null
  } catch (err) {
    error.value = err.message
    console.error('文章加载失败:', err)
  } finally {
    loading.value = false
  }
}

// 新增计算属性
const groupedArticles = computed(() => {
  return [...new Set(articles.value.map(a => new Date(a.date).getFullYear()))]
    .sort()
    .reverse()
    .map(year => ({
      year,
      articles: articles.value.filter(a => 
        new Date(a.date).getFullYear() === year
      )
    }))
})

onMounted(() => {
  if (import.meta.hot) {
    import.meta.hot.on('articles-updated', loadArticles)
  }
  loadArticles()
})

// 新增方法
const getTagColor = (tag) => {
  return TAG_COLORS[tag] || TAG_COLORS.default
}
</script>

<template>
  <div class="articles-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <div class="loading-text">正在加载知识库...</div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button @click="loadArticles">重新加载</button>
      </div>
    </div>

    <!-- 正常状态 -->
    <template v-else>
      <div v-for="group in groupedArticles" :key="group.year" class="year-group">
        <h2 class="year-header">
          <span class="year-text">{{ group.year }}</span>
          <span class="article-count">{{ group.articles.length }} 篇</span>
        </h2>
        <div class="article-list">
          <a 
            v-for="article in group.articles" 
            :key="article.url" 
            :href="article.url" 
            class="article-card"
          >
            <div class="card-content">
              <h3 class="title">{{ article.title }}</h3>
              <div class="meta-info">
                <time class="date">{{ new Date(article.date).toLocaleDateString('zh-CN') }}</time>
                <span class="category">{{ article.category }}</span>
              </div>
              <div class="tag-list">
                <span 
                  v-for="tag in article.tags" 
                  :key="tag"
                  class="tag"
                  :style="{ backgroundColor: getTagColor(tag) }"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* 容器样式 */
.articles-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 0;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--vp-c-brand);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

/* 错误状态 */
.error-state {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
  margin: 2rem 0;
}

.error-icon {
  font-size: 1.5rem;
}

.error-content {
  flex: 1;
}

.error-content h3 {
  color: #dc2626;
  margin: 0 0 0.5rem;
}

.error-content p {
  color: #991b1b;
  margin: 0 0 1rem;
  font-size: 0.9rem;
}

.error-content button {
  background: var(--vp-c-brand);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.error-content button:hover {
  opacity: 0.9;
}

/* 年份分组 */
.year-group {
  margin-bottom: 3rem;
}

.year-header {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 1.5rem;
}

.year-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.article-count {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

/* 文章卡片 */
.article-list {
  display: grid;
  gap: 1rem;
}

.article-card {
  display: block;
  padding: 1.25rem;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  transition: all 0.2s;
  border: 1px solid var(--vp-c-divider);
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: var(--vp-c-brand);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.title {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  margin: 0;
}

.meta-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.date {
  font-feature-settings: "tnum";
}

.category {
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand);
}

.tag-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.tag {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: white;
  line-height: 1.4;
}
</style>
