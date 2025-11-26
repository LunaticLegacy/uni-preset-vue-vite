import { API_BASE_URL, USE_MOCK_API } from '../config.js'
import { getToken, clearToken, clearUserId } from '../utils/storage.js'
import { mockRequest } from './mock.js'

/**
 * 构建完整的URL地址
 * @param {string} path - API路径
 * @param {Object} params - URL参数
 * @returns {string} 完整的URL地址
 */
function buildUrl(path, params, { trailing = true } = {}) {
  const ensureSlash = (p) => (p.startsWith('/') ? p : '/' + p)
  const ensureTrailing = (p) => {
    const seg = p.split('/').filter(Boolean).pop() || ''
    const hasExt = seg.includes('.')
    return !hasExt && !p.endsWith('/') ? p + '/' : p
  }
  const normalizedPath = trailing ? ensureTrailing(ensureSlash(path)) : ensureSlash(path)
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  
  if (/^https?:\/\//i.test(API_BASE_URL)) {
    return new URL(normalizedPath, API_BASE_URL).toString() + query
  }

  return API_BASE_URL.replace(/\/$/, '') + normalizedPath + query
}

/**
 * 构建基础请求体
 * @returns {Object} 包含时间戳和token的基础请求体
 */
function baseBody() {
  const token = getToken()
  return { 
    time: new Date().toISOString(), 
    token: token || null 
  }
}

/**
 * 发送HTTP请求的通用方法
 * @param {Object} options - 请求选项
 * @param {string} options.method - HTTP方法
 * @param {string} options.path - API路径
 * @param {Object} options.data - 请求数据
 * @param {Object} options.params - URL参数
 * @param {Object} options.headers - 请求头
 * @param {boolean} options.auth - 是否自动附带Authorization
 * @param {number} options.retries - 失败重试次数
 * @returns {Promise} 请求Promise
 */
export function request({ method = 'GET', path, data = null, params = null, headers = {}, auth = true, retries = 1, trailing = true }) {
  const url = buildUrl(path, params, { trailing })
  const token = getToken()
  const header = { 
    'Content-Type': 'application/json', 
    ...(auth && token ? { Authorization: `Bearer ${token}` } : {}), 
    ...headers 
  }

  if (USE_MOCK_API) {
    return mockRequest({ method, url, data, header })
  }

  const attempt = (left) => new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
      header,
      data,
      success: (res) => {
        const isUnauthorized = res.statusCode === 401 || res?.data?.error_code === 'UNAUTHORIZED'
        if (isUnauthorized) { 
          handleUnauthorized(res) 
        } else if (res.statusCode >= 400) { 
          notifyError(res) 
        }
        res.ok = !isUnauthorized && res.statusCode >= 200 && res.statusCode < 300 && (res?.data?.status !== 'error')
        resolve(res)
      },
      fail: (err) => {
        if (left > 0) {
          return attempt(left - 1).then(resolve).catch(reject)
        }
        notifyNetworkError(err)
        reject(err)
      }
    })
  })

  return attempt(retries)
}

/**
 * 发送GET请求
 * @param {string} path - API路径
 * @param {Object} params - URL参数
 * @returns {Promise} 请求Promise
 */
export function apiGet(path, params, options = {}) {
  return request({ 
    method: 'GET', 
    path, 
    params, 
    ...options 
  })
}

/**
 * 发送POST请求
 * @param {string} path - API路径
 * @param {Object} payload - 请求数据
 * @returns {Promise} 请求Promise
 */
export function apiPost(path, payload, options = {}) {
  return request({ 
    method: 'POST', 
    path, 
    data: { 
      ...baseBody(), 
      ...(payload || {}) 
    }, 
    ...options 
  })
}

/**
 * 发送PUT请求
 * @param {string} path - API路径
 * @param {Object} payload - 请求数据
 * @returns {Promise} 请求Promise
 */
export function apiPut(path, payload, options = {}) {
  return request({ 
    method: 'PUT', 
    path, 
    data: { 
      ...baseBody(), 
      ...(payload || {}) 
    }, 
    ...options 
  })
}

/**
 * 发送DELETE请求
 * @param {string} path - API路径
 * @param {Object} payload - 请求数据
 * @returns {Promise} 请求Promise
 */
export function apiDelete(path, payload, options = {}) {
  return request({ 
    method: 'DELETE', 
    path, 
    data: { 
      ...baseBody(), 
      ...(payload || {}) 
    }, 
    ...options 
  })
}

/**
 * 处理未授权响应
 */
function handleUnauthorized(res) {
  clearToken()
  clearUserId()
  uni.showToast({ 
    title: res?.data?.message || '登录状态失效，请重新登录', 
    icon: 'none' 
  })
  setTimeout(() => { 
    if (uni.reLaunch) { 
      uni.reLaunch({ url: '/pages/auth/login' }) 
    } else { 
      uni.navigateTo({ url: '/pages/auth/login' }) 
    } 
  }, 200)
}

/**
 * 处理HTTP错误
 */
function notifyError(res) {
  const msg = res?.data?.message || '服务器错误，请稍后重试'
  uni.showToast({ 
    title: msg, 
    icon: 'none' 
  })
}

/**
 * 处理网络错误
 */
function notifyNetworkError(err) {
  uni.showToast({ 
    title: '网络或服务器错误', 
    icon: 'none' 
  })
}
