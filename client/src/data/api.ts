const BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';

async function req(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const getUsers = () => req('/api/users');
export const createUser = (u: any) => req('/api/users', { method: 'POST', body: JSON.stringify(u) });
export const updateUser = (id: string, u: any) => req(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(u) });
export const deleteUser = (id: string) => req(`/api/users/${id}`, { method: 'DELETE' });
export const getJobs = () => req('/api/jobs');
export const getJob = (id: string) => req(`/api/jobs/${id}`);
export const createJob = (j: any) => req('/api/jobs', { method: 'POST', body: JSON.stringify(j) });
export const updateJob = (id: string, j: any) => req(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(j) });
export const getDMs = (userId: string) => req(`/api/dms?userId=${userId}`);
export const sendDM = (dm: any) => req('/api/dms', { method: 'POST', body: JSON.stringify(dm) });
export const markDMsRead = (fromUserId: string, toUserId: string) => req('/api/dms/read', { method: 'PUT', body: JSON.stringify({ fromUserId, toUserId }) });
export const getBoardMessages = () => req('/api/board');
export const postBoardMessage = (msg: any) => req('/api/board', { method: 'POST', body: JSON.stringify(msg) });
export const pinBoardMessage = (id: string) => req(`/api/board/${id}/pin`, { method: 'PUT' });