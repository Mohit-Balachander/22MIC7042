const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJtb2hpdGJhbGFjaGFuZGVyQGdtYWlsLmNvbSIsImV4cCI6MTc3ODkyNzUwNywiaWF0IjoxNzc4OTI2NjA3LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiZDJkODZhYWItMmY4OC00ODhkLWE2NjMtNzZkYzg2NGNlY2ZjIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoibW9oaXQgYmFsYWNoYW5kZXIiLCJzdWIiOiJkOTM1YTQ5Zi0yMmMwLTRiNzUtYTgzOS0yZmNhNTc2OTg0ODYifSwiZW1haWwiOiJtb2hpdGJhbGFjaGFuZGVyQGdtYWlsLmNvbSIsIm5hbWUiOiJtb2hpdCBiYWxhY2hhbmRlciIsInJvbGxObyI6IjIybWljNzA0MiIsImFjY2Vzc0NvZGUiOiJTZkZ1V2ciLCJjbGllbnRJRCI6ImQ5MzVhNDlmLTIyYzAtNGI3NS1hODM5LTJmY2E1NzY5ODQ4NiIsImNsaWVudFNlY3JldCI6IlRDVFp2RVloZHh4Q3JRWngifQ.X8KP1KvMyZUdebsqSxII3AhMdoa2aajlY_AP7XeR3fQ";

const { Log } = require("../logging_middleware/index");

const TYPE_WEIGHT = {
    Placement: 3,
    Result: 2,
    Event: 1
};

async function fetchNotifications() {
    await Log("backend", "info", "service", "fetching notifications from API");
    const response = await fetch("http://4.224.186.213/evaluation-service/notifications", {
        headers: {
            "Authorization": `Bearer ${AUTH_TOKEN}`
        }
    });
    const data = await response.json();
    await Log("backend", "info", "service", "notifications fetched successfully");
    return data.notifications;
}

function getScore(notification) {
    const weight = TYPE_WEIGHT[notification.Type] || 0;
    const timestamp = new Date(notification.Timestamp).getTime();
    return weight * 1e13 + timestamp;
}

async function getTopN(n) {
    await Log("backend", "info", "handler", "computing top n priority notifications");
    const notifications = await fetchNotifications();

    const seen = new Set();
    const unique = notifications.filter(n => {
        if (seen.has(n.ID)) return false;
        seen.add(n.ID);
        return true;
    });

    const sorted = unique.sort((a, b) => getScore(b) - getScore(a));
    const topN = sorted.slice(0, n);

    await Log("backend", "info", "handler", `returning top ${n} priority notifications`);
    return topN;
}

async function main() {
    await Log("backend", "info", "service", "priority inbox started");
    const top10 = await getTopN(10);
    console.log("Top 10 Priority Notifications:");
    console.log(JSON.stringify(top10, null, 2));
}

main();