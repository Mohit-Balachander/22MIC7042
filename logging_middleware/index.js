const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJtb2hpdGJhbGFjaGFuZGVyQGdtYWlsLmNvbSIsImV4cCI6MTc3ODkyNzUwNywiaWF0IjoxNzc4OTI2NjA3LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiZDJkODZhYWItMmY4OC00ODhkLWE2NjMtNzZkYzg2NGNlY2ZjIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoibW9oaXQgYmFsYWNoYW5kZXIiLCJzdWIiOiJkOTM1YTQ5Zi0yMmMwLTRiNzUtYTgzOS0yZmNhNTc2OTg0ODYifSwiZW1haWwiOiJtb2hpdGJhbGFjaGFuZGVyQGdtYWlsLmNvbSIsIm5hbWUiOiJtb2hpdCBiYWxhY2hhbmRlciIsInJvbGxObyI6IjIybWljNzA0MiIsImFjY2Vzc0NvZGUiOiJTZkZ1V2ciLCJjbGllbnRJRCI6ImQ5MzVhNDlmLTIyYzAtNGI3NS1hODM5LTJmY2E1NzY5ODQ4NiIsImNsaWVudFNlY3JldCI6IlRDVFp2RVloZHh4Q3JRWngifQ.X8KP1KvMyZUdebsqSxII3AhMdoa2aajlY_AP7XeR3fQ"

async function Log(stack, level, pkg, message) {
    try {
        const response = await fetch("http://4.224.186.213/evaluation-service/logs", {
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
        });
        const data = await response.json();
        return data;
    } catch (err) {
        return null;
    }
}

module.exports = { Log };