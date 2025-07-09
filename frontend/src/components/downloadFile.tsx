import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { CircularProgress, Box, Typography, Button } from '@mui/material';

const FileDownload = () => {
  const { filename } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const downloadFile = async () => {
      try {
        const response = await fetch(`http://localhost:8000/download-file/${filename}`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename || 'download.pdf';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          navigate('/');
        } else {
          throw new Error('File download failed');
        }
      } catch (error) {
        console.error('Download error:', error);
      }
    };

    downloadFile();
  }, [filename, navigate]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
      <CircularProgress />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Downloading {filename}...
      </Typography>
      <Button 
        variant="contained" 
        sx={{ mt: 2 }}
        onClick={() => navigate('/')}
      >
        Back to Home
      </Button>
    </Box>
  );
};

export default FileDownload;