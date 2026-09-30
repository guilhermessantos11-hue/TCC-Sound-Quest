const TOKEN_KEY = "sq_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token, user, company) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem("sq_user", JSON.stringify(user));
  if (company) localStorage.setItem("sq_company", JSON.stringify(company));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("sq_user");
  localStorage.removeItem("sq_company");
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("sq_user") || "null");
  } catch {
    return null;
  }
}

export function getCompany() {
  try {
    return JSON.parse(localStorage.getItem("sq_company") || "null");
  } catch {
    return null;
  }
}

export async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Falha na comunicacao com o servidor.");
    err.status = res.status;
    throw err;
  }
  return data;
}
