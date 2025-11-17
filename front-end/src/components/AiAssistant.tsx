import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { clearSuggestion, requestSuggestion } from '../store/slices/aiSlice';

type Props = {
  teamContext?: string;
};

export const AiAssistant = ({ teamContext }: Props) => {
  const dispatch = useAppDispatch();
  const { suggestion, status, error } = useAppSelector((state) => state.ai);
  const [prompt, setPrompt] = useState('');

  const handleRequest = () => {
    if (!prompt.trim()) return;
    dispatch(requestSuggestion({ prompt, teamContext }));
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h6">AI Task Assistant</Typography>
        </Stack>
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
      </CardContent>
    </Card>
  );
};

