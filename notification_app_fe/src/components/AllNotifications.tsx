import { useEffect, useState } from 'react'
import { Box, Card, CardContent, Typography, Chip, Select, MenuItem, Pagination, CircularProgress } from '@mui/material'
import { fetchNotifications } from '../api'
import { Log } from '../logger'

interface Notification {
    ID: string
    Type: string
    Message: string
    Timestamp: string
}

export default function AllNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [page, setPage] = useState(1)
    const [filter, setFilter] = useState('')
    const [loading, setLoading] = useState(false)
    const [viewed, setViewed] = useState<Set<string>>(new Set())

    useEffect(() => {
        async function load() {
            setLoading(true)
            await Log("frontend", "info", "component", "loading all notifications")
            try {
                const data = await fetchNotifications(page, 10, filter || undefined)
                setNotifications(data)
                await Log("frontend", "info", "component", "notifications loaded successfully")
            } catch (err) {
                await Log("frontend", "error", "component", "failed to load notifications")
            }
            setLoading(false)
        }
        load()
    }, [page, filter])

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
                <Select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} displayEmpty size="small">
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
                notifications.map(n => (
                    <Card key={n.ID} onClick={() => handleView(n.ID)} sx={{ mb: 2, cursor: 'pointer', border: viewed.has(n.ID) ? '1px solid #ccc' : '2px solid #1976d2', opacity: viewed.has(n.ID) ? 0.7 : 1 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">{n.Message}</Typography>
                                <Chip label={n.Type} color={getColor(n.Type) as any} size="small" />
                            </Box>
                            <Typography variant="body2" color="text.secondary">{n.Timestamp}</Typography>
                            {!viewed.has(n.ID) && <Chip label="New" color="primary" size="small" sx={{ mt: 1 }} />}
                        </CardContent>
                    </Card>
                ))
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination count={10} page={page} onChange={(_, val) => setPage(val)} />
            </Box>
        </Box>
    )
}