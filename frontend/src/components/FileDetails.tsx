import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router';

interface FileDetailsProps {
  fileName: string;
  onRemove: (fileName: string) => void;
}

const FileDetails: React.FC<FileDetailsProps> = ({ fileName, onRemove }) => {
  const navigate = useNavigate();

  const handleDownload = () => {
    navigate(`/download/${fileName}`);
  };

  return (
    <Card sx={{ minWidth: 275, maxWidth: 300 }}>
      <CardContent>
        <Typography variant="h6" noWrap>
          {fileName}
        </Typography>
        <Typography sx={{ fontSize: 14 }} color="text.secondary">
          PDF Document
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={handleDownload}>
          Download
        </Button>
        <Button 
          size="small" 
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => onRemove(fileName)}
        >
          Remove
        </Button>
      </CardActions>
    </Card>
  );
};

export default FileDetails;