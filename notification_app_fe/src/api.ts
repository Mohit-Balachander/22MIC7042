const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJtb2hpdGJhbGFjaGFuZGVyQGdtYWlsLmNvbSIsImV4cCI6MTc3ODkzMTAyMywiaWF0IjoxNzc4OTMwMTIzLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNzExNGI4MDctOGQxMi00NTFkLTk3M2MtY2ZhMzY0MWVmZDgwIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoibW9oaXQgYmFsYWNoYW5kZXIiLCJzdWIiOiJkOTM1YTQ5Zi0yMmMwLTRiNzUtYTgzOS0yZmNhNTc2OTg0ODYifSwiZW1haWwiOiJtb2hpdGJhbGFjaGFuZGVyQGdtYWlsLmNvbSIsIm5hbWUiOiJtb2hpdCBiYWxhY2hhbmRlciIsInJvbGxObyI6IjIybWljNzA0MiIsImFjY2Vzc0NvZGUiOiJTZkZ1V2ciLCJjbGllbnRJRCI6ImQ5MzVhNDlmLTIyYzAtNGI3NS1hODM5LTJmY2E1NzY5ODQ4NiIsImNsaWVudFNlY3JldCI6IlRDVFp2RVloZHh4Q3JRWngifQ.GSzWOR41QD2IGQq86SsUKQ7Rz3ARy_sVYeJ2KGib8Og"

const BASE_URL = "/api"

export async function fetchNotifications(
    page: number,
    limit: number,
    notification_type?: string
) {
    let url = `${BASE_URL}/notifications?page=${page}&limit=${limit}`

    if (notification_type) {
        url += `&notification_type=${notification_type}`
    }

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${AUTH_TOKEN}`
        }
    })

    const data = await response.json()

    return data.notifications || []
}