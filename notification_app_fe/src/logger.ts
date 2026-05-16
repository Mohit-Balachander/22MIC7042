const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJtb2hpdGJhbGFjaGFuZGVyQGdtYWlsLmNvbSIsImV4cCI6MTc3ODkzMTAyMywiaWF0IjoxNzc4OTMwMTIzLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNzExNGI4MDctOGQxMi00NTFkLTk3M2MtY2ZhMzY0MWVmZDgwIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoibW9oaXQgYmFsYWNoYW5kZXIiLCJzdWIiOiJkOTM1YTQ5Zi0yMmMwLTRiNzUtYTgzOS0yZmNhNTc2OTg0ODYifSwiZW1haWwiOiJtb2hpdGJhbGFjaGFuZGVyQGdtYWlsLmNvbSIsIm5hbWUiOiJtb2hpdCBiYWxhY2hhbmRlciIsInJvbGxObyI6IjIybWljNzA0MiIsImFjY2Vzc0NvZGUiOiJTZkZ1V2ciLCJjbGllbnRJRCI6ImQ5MzVhNDlmLTIyYzAtNGI3NS1hODM5LTJmY2E1NzY5ODQ4NiIsImNsaWVudFNlY3JldCI6IlRDVFp2RVloZHh4Q3JRWngifQ.GSzWOR41QD2IGQq86SsUKQ7Rz3ARy_sVYeJ2KGib8Og"

export async function Log(stack: string, level: string, pkg: string, message: string) {
    try {
        await fetch("/api/logs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify({
                stack: stack,
                level: level,
                package: pkg,
                message: message
            })
        })
    } catch (err) {
        return null
    }
}