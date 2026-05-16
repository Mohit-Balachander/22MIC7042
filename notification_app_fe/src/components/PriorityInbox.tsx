import { useEffect, useState } from 'react'
import { Box, Card, CardContent, Typography, Chip, Select, MenuItem, TextField, CircularProgress } from '@mui/material'
import { fetchNotifications } from '../api'
import { Log } from '../logger'

interface Notification {
    ID: string
    Type: string
    Message: string
    Timestamp: string
}

const TYPE_WEIGHT: Record<string, number> = {
    Placement: 3,
    Result: 2,
    Event: 1
}

function getScore(n: Notification): number {
    const weight = TYPE_WEIGHT[n.Type] || 0
    const timestamp = new Date(n.Timestamp).getTime()
    return weight * 1e13 + timestamp
}

export default function PriorityInbox() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [topN, setTopN] = useState(10)
    const [filter, setFilter] = useState('')
    const [loading, setLoading] = useState(false)
    const [viewed, setViewed] = useState<Set<string>>(new Set())

    useEffect(() => {
        async function load() {
            setLoading(true)
            await Log("frontend", "info", "component", "loading priority inbox notifications")
            try {
                const data = await fetchNotifications(1, 100, filter || undefined)
                const seen = new Set()
                const unique = data.filter((n: Notification) => {
                    if (seen.has(n.ID)) return false
                    seen.add(n.ID)
                    return true
                })
                const sorted = unique.sort((a: Notification, b: Notification) => getScore(b) - getScore(a))
                setNotifications(sorted.slice(0, topN))
                await Log("frontend", "info", "component", `priority inbox loaded top ${topN} notifications`)
            } catch (err) {
                await Log("frontend", "error", "component", "failed to load priority inbox")
            }
            setLoading(false)
        }
        load()
    }, [topN, filter])

    const handleView = (id: string) => {
        setViewed(prev => new Set(prev).add(id))
    }

    const getColor = (type: string) => {
        if (type === 'Placement') return 'success'
        if (type === 'Result') return 'warning'
        return 'info'
    }

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    label="Top N"
                    type="number"
                    size="small"
                    value={topN}
                    onChange={e => setTopN(Number(e.target.value))}
                    sx={{ width: 100 }}
                />
                <Select value={filter} onChange={e => setFilter(e.target.value)} displayEmpty size="small">
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="Placement">Placement</MenuItem>
                    <MenuItem value="Result">Result</MenuItem>
                    <MenuItem value="Event">Event</MenuItem>
                </Select>
            </Box>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                notifications.map((n, index) => (
                    <Card key={n.ID} onClick={() => handleView(n.ID)} sx={{ mb: 2, cursor: 'pointer', border: viewed.has(n.ID) ? '1px solid #ccc' : '2px solid #1976d2', opacity: viewed.has(n.ID) ? 0.7 : 1 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">#{index + 1}</Typography>
                                <Chip label={n.Type} color={getColor(n.Type) as any} size="small" />
                            </Box>
                            <Typography variant="h6">{n.Message}</Typography>
                            <Typography variant="body2" color="text.secondary">{n.Timestamp}</Typography>
                            {!viewed.has(n.ID) && <Chip label="New" color="primary" size="small" sx={{ mt: 1 }} />}
                        </CardContent>
                    </Card>
                ))
            )}
        </Box>
    )
}