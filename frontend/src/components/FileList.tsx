import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import FileDetails from './FileDetails'; // We'll create this
import axios from 'axios';

interface FileListProps {
  refreshTrigger: boolean;
  onFilesUpdated: (files: string[]) => void;
}

const FileList: React.FC<FileListProps> = ({ refreshTrigger, onFilesUpdated }) => {
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get('http://localhost:8000/list-files');
        setFiles(response.data.files);
        onFilesUpdated(response.data.files);
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    };

    fetchFiles();
  }, [refreshTrigger, onFilesUpdated]);

  const handleRemove = async (fileName: string) => {
    try {
      await axios.delete(`http://localhost:8000/remove-file/${fileName}`);
      setFiles(files.filter(file => file !== fileName));
      onFilesUpdated(files.filter(file => file !== fileName));
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {files.map((file) => (
        <FileDetails 
          key={file} 
          fileName={file} 
          onRemove={handleRemove} 
        />
      ))}
    </Box>
  );
};

export default FileList;