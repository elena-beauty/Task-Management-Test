import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Paper,
  IconButton,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear';
import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { clearSuggestion, requestSuggestion, sendChatMessage, clearChat } from '../store/slices/aiSlice';

type Props = {
  teamContext?: string;
};

export const AiAssistant = ({ teamContext }: Props) => {
  const dispatch = useAppDispatch();
  const { suggestion, status, error, chatMessages, chatStatus, chatError } = useAppSelector((state) => state.ai);
  const [prompt, setPrompt] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleRequest = () => {
    if (!prompt.trim()) return;
    dispatch(requestSuggestion({ prompt, teamContext }));
  };

  const handleSendChat = () => {
    if (!chatMessage.trim() || chatStatus === 'loading') return;
    dispatch(sendChatMessage({ message: chatMessage }));
    setChatMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={2} justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6">AI Task Assistant</Typography>
          </Stack>
          <Button
            size="small"
            variant={showChat ? "contained" : "outlined"}
            onClick={() => setShowChat(!showChat)}
          >
            {showChat ? 'Task Suggestion' : 'Chat'}
          </Button>
        </Stack>

        {showChat ? (
          <Stack spacing={2} sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Chat Messages */}
            <Paper
              variant="outlined"
              sx={{
                flex: 1,
                p: 2,
                overflowY: 'auto',
                backgroundColor: 'grey.50',
                minHeight: 200,
                maxHeight: 400,
              }}
            >
              {chatMessages.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
                  Start a conversation with the AI assistant. Ask questions about task management, productivity, or get help with your team's workflow.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {chatMessages.map((msg) => (
                    <Box
                      key={msg.id}
                      sx={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          maxWidth: '80%',
                          backgroundColor: msg.role === 'user' ? 'primary.light' : 'background.paper',
                          color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                        }}
                      >
                        <Typography variant="body2" whiteSpace="pre-wrap">
                          {msg.content}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                  {chatStatus === 'loading' && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          backgroundColor: 'background.paper',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Thinking...
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </Stack>
              )}
            </Paper>

            {/* Chat Input */}
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder="Type your message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={chatStatus === 'loading'}
                size="small"
              />
              <IconButton
                color="primary"
                onClick={handleSendChat}
                disabled={!chatMessage.trim() || chatStatus === 'loading'}
              >
                <SendIcon />
              </IconButton>
              {chatMessages.length > 0 && (
                <IconButton
                  color="default"
                  onClick={() => dispatch(clearChat())}
                  size="small"
                >
                  <ClearIcon />
                </IconButton>
              )}
            </Stack>

            {chatError && <Alert severity="error">{chatError}</Alert>}
          </Stack>
        ) : (
          <Stack spacing={2}>
            <TextField
              multiline
              minRows={3}
              label="What should we work on?"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              helperText="Describe the task and context for a tailored suggestion."
            />
            <Button
              variant="contained"
              onClick={handleRequest}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Thinking…' : 'Generate suggestion'}
            </Button>
            {error && <Alert severity="error">{error}</Alert>}
            {suggestion && (
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                  backgroundColor: 'grey.50',
                }}
              >
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2" color="text.secondary">
                    Confidence {Math.round(suggestion.confidence * 100)}%
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => dispatch(clearSuggestion())}
                  >
                    Clear
                  </Button>
                </Stack>
                <Typography variant="subtitle1" mt={1}>
                  {suggestion.titleSuggestion}
                </Typography>
                <Typography variant="body2" whiteSpace="pre-line" mt={1}>
                  {suggestion.descriptionSuggestion}
                </Typography>
                <Typography variant="caption" color="text.secondary" mt={1}>
                  Recommended status: {suggestion.recommendedStatus}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Reasoning: {suggestion.reasoning}
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

