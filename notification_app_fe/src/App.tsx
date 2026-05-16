import { useState } from 'react'
import { Box, Tabs, Tab, Typography, Container } from '@mui/material'
import AllNotifications from './components/AllNotifications'
import PriorityInbox from './components/PriorityInbox'
import { Log } from './logger'

export default function App() {
    const [tab, setValue] = useState(0)

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue)
        Log("frontend", "info", "page", newValue === 0 ? "navigated to all notifications" : "navigated to priority inbox")
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 2 }}>
                <Typography variant="h4" fontWeight={700}>Campus Notifications</Typography>
            </Box>
            <Tabs value={tab} onChange={handleChange} sx={{ mb: 3 }}>
                <Tab label="All Notifications" />
                <Tab label="Priority Inbox" />
            </Tabs>
            {tab === 0 && <AllNotifications />}
            {tab === 1 && <PriorityInbox />}
        </Container>
    )
}