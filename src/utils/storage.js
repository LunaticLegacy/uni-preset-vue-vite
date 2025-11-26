/**
 * 获取存储的认证令牌
 * @returns {string|null} 认证令牌或null
 */
export function getToken() {
  try { 
    return uni.getStorageSync('auth_token') || null 
  } catch (e) { 
    return null 
  }
}

/**
 * 设置认证令牌
 * @param {string} token - 认证令牌
 */
export function setToken(token) {
  try { 
    uni.setStorageSync('auth_token', token || '') 
  } catch (e) {}
}

/**
 * 清除认证令牌
 */
export function clearToken() {
  try { 
    uni.removeStorageSync('auth_token') 
  } catch (e) {}
}

/**
 * 获取存储的用户ID
 * @returns {string|null} 用户ID或null
 */
export function getUserId() {
  try { 
    return uni.getStorageSync('user_id') || null 
  } catch (e) { 
    return null 
  }
}

/**
 * 设置用户ID
 * @param {string} id - 用户ID
 */
export function setUserId(id) {
  try { 
    uni.setStorageSync('user_id', id || '') 
  } catch (e) {}
}

/**
 * 清除用户ID
 */
export function clearUserId() {
  try { 
    uni.removeStorageSync('user_id') 
  } catch (e) {}
}

/**
 * 当前工作空间上下文（id/name）
 */
const WORKSPACE_KEY = 'current_workspace'

export function setCurrentWorkspace(workspace) {
  try {
    const payload = workspace ? { id: workspace.id || '', name: workspace.name || '' } : null
    uni.setStorageSync(WORKSPACE_KEY, payload)
  } catch (e) {}
}

export function getCurrentWorkspace() {
  try {
    return uni.getStorageSync(WORKSPACE_KEY) || null
  } catch (e) {
    return null
  }
}

export function clearCurrentWorkspace() {
  try {
    uni.removeStorageSync(WORKSPACE_KEY)
  } catch (e) {}
}
