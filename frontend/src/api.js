export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    let message = `Backend error: ${res.status}`;
    try {
      const data = await res.json();
      message = data.message || JSON.stringify(data);
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

export const queueApi = {
  getStatus: () => request("/api/queue/status"),
  addPatient: (name) =>
    request("/api/queue/add", {
      method: "POST",
      body: JSON.stringify({ name })
    }),
  callNext: () =>
    request("/api/queue/call-next", {
      method: "POST"
    }),
  updateAvgTime: (minutes) =>
    request(`/api/queue/avg-time?minutes=${minutes}`, {
      method: "POST"
    }),
  reset: () =>
    request("/api/queue/reset", {
      method: "POST"
    })
};
