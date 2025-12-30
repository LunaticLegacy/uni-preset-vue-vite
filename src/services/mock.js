import { getToken, setToken, clearToken, getUserId, setUserId } from '../utils/storage.js'

function nowISO() { return new Date().toISOString() }
function uuid() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16) }) }

function readStore(key, def) {
  try { const v = uni.getStorageSync(key); return v ? JSON.parse(v) : (def ?? null) } catch { return def ?? null }
}
function writeStore(key, val) {
  try { uni.setStorageSync(key, JSON.stringify(val)) } catch {}
}

const db = {
  workspaces: () => readStore('db_workspaces', []),
  setWorkspaces: (v) => writeStore('db_workspaces', v),
  projects: () => readStore('db_projects', []),
  setProjects: (v) => writeStore('db_projects', v),
  tasks: () => readStore('db_tasks', []),
  setTasks: (v) => writeStore('db_tasks', v),
}

function ensureAuth(required=true) {
  const token = getToken()
  if (required && !token) return { status: 'error', error_code: 'UNAUTHORIZED', message: '未授权访问', details: {} }
  return null
}

export async function mockRequest({ method, url, data, header }) {
  const u = new URL(url, 'http://mock.local')
  const path = u.pathname

  // USER
  if (method === 'POST' && path === '/user/register') {
    const id = uuid();
    setUserId(id)
    return { statusCode: 200, data: { status: 'success', user_id: id, message: '注册成功' } }
  }
  if (method === 'POST' && path === '/user/login') {
    const id = getUserId() || uuid();
    setUserId(id)
    const token = uuid();
    setToken(token)
    return { statusCode: 200, data: { status: 'success', user_id: id, token, message: '登录成功' } }
  }
  if (method === 'POST' && path === '/user/logout') {
    const err = ensureAuth(true); if (err) return { statusCode: 401, data: err }
    clearToken()
    return { statusCode: 200, data: { status: 'success', message: '登出成功' } }
  }
  if (method === 'GET' && path.startsWith('/user/profile/')) {
    const id = path.split('/').pop()
    return { statusCode: 200, data: { status: 'success', data: { id, email: 'user@example.com', full_name: 'Demo User', display_name: 'Demo', avatar_url: '', bio: '', job_title: '', organization: '', created_at: nowISO() } } }
  }
  if ((method === 'PUT' || method === 'DELETE') && path.startsWith('/user/profile/')) {
    const err = ensureAuth(true); if (err) return { statusCode: 401, data: err }
    if (method === 'PUT') {
      const id = path.split('/').pop()
      return { statusCode: 200, data: { status: 'success', data: { id, email: 'user@example.com', full_name: data.full_name || 'Demo User', display_name: data.display_name || 'Demo', bio: data.bio || '', updated_at: nowISO() }, message: '用户信息更新成功' } }
    }
    return { statusCode: 200, data: { status: 'success', message: '用户删除成功' } }
  }

  // WORKSPACES
  if (path === '/workspaces' && method === 'GET') {
    const list = db.workspaces()
    return { statusCode: 200, data: { status: 'success', data: list, count: list.length } }
  }
  if (path === '/workspaces' && method === 'POST') {
    const err = ensureAuth(true); if (err) return { statusCode: 401, data: err }
    const ws = { id: uuid(), name: data.name || 'New Workspace', description: data.description || '', owner_user_id: getUserId() || uuid(), created_at: nowISO() }
    const list = db.workspaces(); list.push(ws); db.setWorkspaces(list)
    return { statusCode: 200, data: { status: 'success', data: ws, message: '工作空间创建成功' } }
  }
  if (path.startsWith('/workspaces/') ) {
    const id = path.split('/').pop()
    if (method === 'GET') {
      const ws = db.workspaces().find(x=>x.id===id)
      if (!ws) return { statusCode: 404, data: { status:'error', error_code:'NOT_FOUND', message:'资源未找到', details:{} } }
      return { statusCode: 200, data: { status:'success', data: { ...ws, updated_at: ws.updated_at || ws.created_at } } }
    }
    const err = ensureAuth(true); if (err) return { statusCode: 401, data: err }
    if (method === 'PUT') {
      const list = db.workspaces(); const idx = list.findIndex(x=>x.id===id)
      if (idx<0) return { statusCode:404, data:{ status:'error', error_code:'NOT_FOUND', message:'资源未找到', details:{} } }
      list[idx] = { ...list[idx], name: data.name ?? list[idx].name, description: data.description ?? list[idx].description, updated_at: nowISO() }
      db.setWorkspaces(list)
      return { statusCode:200, data:{ status:'success', data: list[idx], message:'工作空间更新成功' } }
    }
    if (method === 'DELETE') {
      const list = db.workspaces().filter(x=>x.id!==id); db.setWorkspaces(list)
      return { statusCode:200, data:{ status:'success', message:'工作空间删除成功' } }
    }
  }

  // PROJECTS
  if (path === '/projects' && method === 'GET') {
    const list = db.projects()
    const workspace_id = u.searchParams.get('workspace_id')
    const owner_id = u.searchParams.get('owner_id')
    const filtered = list.filter(p => (!workspace_id || p.workspace_id===workspace_id) && (!owner_id || p.owner_id===owner_id))
    return { statusCode: 200, data: { status: 'success', data: filtered, count: filtered.length } }
  }
  if (path === '/projects' && method === 'POST') {
    const err = ensureAuth(true); if (err) return { statusCode: 401, data: err }
    const proj = { id: uuid(), workspace_id: data.workspace_id, title: data.title || 'New Project', description: data.description || '', owner_id: getUserId() || uuid(), created_at: nowISO() }
    const list = db.projects(); list.push(proj); db.setProjects(list)
    return { statusCode: 200, data: { status: 'success', data: proj, message: '项目创建成功' } }
  }
  if (path.startsWith('/projects/')) {
    const id = path.split('/').pop()
    if (method === 'GET') {
      const p = db.projects().find(x=>x.id===id)
      if (!p) return { statusCode:404, data:{ status:'error', error_code:'NOT_FOUND', message:'资源未找到', details:{} } }
      return { statusCode:200, data:{ status:'success', data:{ ...p, updated_at: p.updated_at || p.created_at } } }
    }
    const err = ensureAuth(true); if (err) return { statusCode: 401, data: err }
    if (method === 'PUT') {
      const list = db.projects(); const idx = list.findIndex(x=>x.id===id)
      if (idx<0) return { statusCode:404, data:{ status:'error', error_code:'NOT_FOUND', message:'资源未找到', details:{} } }
      list[idx] = { ...list[idx], title: data.title ?? list[idx].title, description: data.description ?? list[idx].description, updated_at: nowISO() }
      db.setProjects(list)
      return { statusCode:200, data:{ status:'success', data:list[idx], message:'项目更新成功' } }
    }
    if (method === 'DELETE') {
      const list = db.projects().filter(x=>x.id!==id); db.setProjects(list)
      return { statusCode:200, data:{ status:'success', message:'项目删除成功' } }
    }
  }

  // TASKS
  if (path === '/tasks' && method === 'GET') {
    const list = db.tasks()
    const project_id = u.searchParams.get('project_id')
    const assignee_id = u.searchParams.get('assignee_id')
    const status = u.searchParams.get('status')
    const workspace_id = u.searchParams.get('workspace_id')
    const filtered = list.filter(t => (!project_id || t.project_id===project_id) && (!assignee_id || t.assignee_id===assignee_id) && (!status || t.status===status) && (!workspace_id || t.workspace_id===workspace_id))
    return { statusCode:200, data:{ status:'success', data: filtered, count: filtered.length } }
  }
  if (path === '/tasks' && method === 'POST') {
    const err = ensureAuth(true); if (err) return { statusCode:401, data: err }
    const t = { id: uuid(), project_id: data.project_id, title: data.title || 'New Task', description: data.description || '', status: 'backlog', priority: data.priority || 'medium', due_at: data.due_at || null, creator_id: getUserId() || uuid(), created_at: nowISO() }
    const list = db.tasks(); list.push(t); db.setTasks(list)
    return { statusCode:200, data:{ status:'success', data:t, message:'任务创建成功' } }
  }
  if (path.startsWith('/tasks/')) {
    const id = path.split('/').pop()
    if (method === 'GET') {
      const t = db.tasks().find(x=>x.id===id)
      if (!t) return { statusCode:404, data:{ status:'error', error_code:'NOT_FOUND', message:'资源未找到', details:{} } }
      return { statusCode:200, data:{ status:'success', data:{ ...t, updated_at: t.updated_at || t.created_at } } }
    }
    const err = ensureAuth(true); if (err) return { statusCode:401, data: err }
    if (method === 'PUT') {
      const list = db.tasks(); const idx = list.findIndex(x=>x.id===id)
      if (idx<0) return { statusCode:404, data:{ status:'error', error_code:'NOT_FOUND', message:'资源未找到', details:{} } }
      list[idx] = { ...list[idx], ...data, updated_at: nowISO() }
      db.setTasks(list)
      return { statusCode:200, data:{ status:'success', data:list[idx], message:'任务更新成功' } }
    }
    if (method === 'DELETE') {
      const list = db.tasks().filter(x=>x.id!==id); db.setTasks(list)
      return { statusCode:200, data:{ status:'success', message:'任务删除成功' } }
    }
  }



  return { statusCode: 404, data: { status:'error', error_code:'NOT_FOUND', message:`未匹配的Mock: ${method} ${path}`, details:{} } }
}
