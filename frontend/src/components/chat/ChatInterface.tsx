import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Divider, List, ListItem, ListItemButton,
  ListItemText, Avatar, IconButton, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, CircularProgress, Button
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import { deepOrange, deepPurple } from '@mui/material/colors';

interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
}

const ChatInterface: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);

  // Share dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = { id: newId, title: 'New Chat', messages: [] };
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newId);
  };

  const handleSend = () => {
    if (!input.trim() || !activeSessionId) return;
    const newMsg: ChatMessage = { id: Date.now().toString(), message: input.trim(), isUser: true };
    setSessions(prev =>
      prev.map(session =>
        session.id === activeSessionId
          ? {
              ...session,
              title: session.messages.length === 0 ? input.trim().slice(0, 20) : session.title,
              messages: [
                ...session.messages,
                newMsg,
                { id: Date.now().toString() + '-ai', message: "AI response to: " + input, isUser: false }
              ]
            }
          : session
      )
    );
    setInput('');
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, sessionId: string) => {
    setAnchorEl(e.currentTarget);
    setMenuSessionId(sessionId);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuSessionId(null);
  };

  const handleShare = () => {
    if (menuSessionId) {
      setShareDialogOpen(true);
      setShareLoading(true);
      setCopied(false);
      setTimeout(() => {
        const link = `${window.location.origin}/chat/${menuSessionId}`;
        setShareLink(link);
        setShareLoading(false);
      }, 1200);
    }
    handleMenuClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleDelete = () => {
    if (menuSessionId) {
      setSessions(prev => prev.filter(s => s.id !== menuSessionId));
      if (activeSessionId === menuSessionId) setActiveSessionId(null);
    }
    handleMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#fff' }}>
      {/* Sidebar */}
      <Box sx={{ width: { xs: '40%', md: '20%' }, bgcolor: '#f9f9f9', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6">Chats</Typography>
          <button onClick={createNewSession} style={{
            marginTop: 8, background: '#00c6ff', color: '#fff',
            border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer'
          }}>+ New Chat</button>
        </Box>
        <Divider />
        <List dense sx={{ flex: 1, overflowY: 'auto' }}>
          {sessions.map(s => (
            <ListItem key={s.id} disablePadding
              secondaryAction={
                <IconButton edge="end" onClick={(e) => handleMenuOpen(e, s.id)}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              }>
              <ListItemButton selected={s.id === activeSessionId} onClick={() => setActiveSessionId(s.id)}>
                <ListItemText primary={s.title} primaryTypographyProps={{ fontSize: 13, noWrap: true }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Chat area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {activeSession ? activeSession.messages.map(m => (
            <Box key={m.id} sx={{ display: 'flex', mb: 1 }}>
              <Avatar sx={{ bgcolor: m.isUser ? deepPurple[500] : deepOrange[500], width: 28, height: 28, fontSize: 12 }}>
                {m.isUser ? 'You' : 'AI'}
              </Avatar>
              <Typography sx={{ ml: 1, bgcolor: m.isUser ? '#e0e0ff' : '#f6f6f6', p: 1.2, borderRadius: 2, maxWidth: '80%', wordWrap: 'break-word' }} variant="body2">
                {m.message}
              </Typography>
            </Box>
          )) : (
            <Typography sx={{ mt: 2, color: '#999' }} variant="body2">Start a new chat to begin</Typography>
          )}
          <div ref={chatEndRef} />
        </Box>

        {activeSessionId && (
          <Box sx={{ display: 'flex', p: 1, borderTop: '1px solid #ddd', bgcolor: '#fafafa' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey ? (e.preventDefault(), handleSend()) : null}
              style={{ flex: 1, resize: 'none', padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }}
              placeholder="Type a message..."
            />
            <button onClick={handleSend} style={{ marginLeft: 8, background: '#00c6ff', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
              Send
            </button>
          </Box>
        )}
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleShare}>Share</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>

      {/* Share dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Share Chat
          <IconButton onClick={() => setShareDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 300 }}>
          {shareLoading ? (
            <>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body2">Generating share link...</Typography>
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ wordBreak: 'break-all', mb: 2 }}>{shareLink}</Typography>
              <Button onClick={handleCopy} variant="contained" size="small">
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ChatInterface;
