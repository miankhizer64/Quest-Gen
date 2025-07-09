import React, { useState } from "react";
import "./App.css";
import { Box, Typography } from "@mui/material";
import FileUploader from "./components/uploader/fileUploader";
import ChatInterface from "./components/chat/ChatInterface";
import FileList from "./components/FileList";
import FileDownload from "./components/downloadFile";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./components/dashboard/Dashboard";

function App(): JSX.Element {
  // Files state: list of uploaded file names
  const [files, setFiles] = useState<string[]>([]);
  const [refreshFiles, setRefreshFiles] = useState<boolean>(false);

  // When upload succeeds, refresh the file list
  const handleFileUploaded = (): void => {
    setRefreshFiles((prev) => !prev);
  };

  return (
    <Router>
      <Routes>
        {/* === Public Pages === */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/*for dashboard  */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* === Protected App Area === */}
        <Route
          path="/app"
          element={
            <div className="main-holder">
              <Typography margin="auto" variant="h4" gutterBottom>
                Ask me anything about your data
              </Typography>
              <Box my={3} mx={5}>
                <Typography variant="body1">
                  Upload your PDF files, and then start asking questions about
                  them. Please note that indexing files may take a moment if the
                  files are large.
                </Typography>
              </Box>

              {/* File uploader */}
              <FileUploader onUploadSuccess={handleFileUploaded} />

              {/* File list */}
              <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Your Uploaded Files
                </Typography>
                <FileList
                  refreshTrigger={refreshFiles}
                  onFilesUpdated={(updatedFiles: string[]) =>
                    setFiles(updatedFiles)
                  }
                />
              </Box>

              {/* Chat */}
              <ChatInterface />
            </div>
          }
        />

        {/* === File Download === */}
        <Route path="/download/:filename" element={<FileDownload />} />
      </Routes>
    </Router>
  );
}

export default App;