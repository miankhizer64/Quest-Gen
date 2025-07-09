import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Plus, MessageCircle, Settings, Upload, Send, User, FileText, Clock, MoreHorizontal, ZoomIn, ZoomOut, RotateCw, Download, Trash2, AlertCircle, LogOut } from 'lucide-react';

// Import functions from the centralized API client
import {
  getCurrentUser,
  logout,
  listFiles,
  uploadDocument,
  removeFile,
  downloadFile,
  getComprehensiveAnswer,
  getAnswer,
  ComprehensiveQueryResponse,
  QueryResponse,
  downloadConversations
} from '../../apis/api'; // adjust path if necessary

function isComprehensiveResponse(
  res: QueryResponse | ComprehensiveQueryResponse
): res is ComprehensiveQueryResponse {
  return (res as ComprehensiveQueryResponse).comprehensive_answer !== undefined;
}

const handleDownloadConversation = async () => {
  try {
    const blob = await downloadConversations(); // assumes optional user_id, limit handled inside
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `conversation_history_${timestamp}.docx`; // .docx from backend
    link.click();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Conversation download failed:', error);
    alert('Failed to download conversation. Please try again.');
  }
};


// Robust handler for sending user messages with fallback logic
const handleSendMessage = async (
  messageToSend: string,
  useComprehensive: boolean,
  currentFile: any,
  setChatHistory: Function,
  setIsLoading: Function,
  setError: Function
) => {
  try {
    let response;

    if (useComprehensive) {
      response = await getComprehensiveAnswer(messageToSend, {
        use_pdf_context: !!currentFile,
        generate_comprehensive: true,
        max_tokens: 1000,
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid comprehensive response structure');
      }

      console.log('✅ Comprehensive Response:', response);
    } else {
      response = await getAnswer(messageToSend);

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid simple response structure');
      }

      console.log('✅ Simple Response:', response);
    }

    const llmResponse = {
      type: 'llm',
      content: response,
      // content: useComprehensive
      //   ? response.comprehensive_answer || '[Missing comprehensive_answer]'
      //   : response.response || '[Missing response]',
      timestamp: new Date(),
      isComprehensive: useComprehensive,
    };

    setChatHistory((prev: any) => [...prev, llmResponse]);
  } catch (error: any) {
    console.error('❌ Error getting response:', error);
    setError(
      typeof error?.message === 'string'
        ? `Failed: ${error.message}`
        : 'Failed to get response. Please try again.'
    );

    setChatHistory((prev: any) => [
      ...prev,
      {
        type: 'llm',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      },
    ]);
  } finally {
    setIsLoading(false);
  }
};


// Types
interface ChatMessage {
  type: 'user' | 'llm';
  content: string;
  timestamp: Date;
  isComprehensive?: boolean;
}

interface PreviousChat {
  id: number;
  title: string;
  date: string;
  messageCount: number;
  lastMessage: string;
}

interface Suggestion {
  id: string;
  text: string;
}

interface UploadedFile {
  name: string;
  size: number;
  uploadDate: Date;
}

// User profile interface based on your API response
interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name?: string; // ✅ make this optional
  is_active: boolean;
  created_at: string;
}


type ViewType = 'chat' | 'allChats' | 'settings';

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pdfZoom, setPdfZoom] = useState<number>(1);
  const [pdfRotation, setPdfRotation] = useState<number>(0);
  const [useComprehensive, setUseComprehensive] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // New state for user profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  
  const [previousChats, setPreviousChats] = useState<PreviousChat[]>([
    { 
      id: 1, 
      title: 'Brief summary of "AI in Everyday Life"', 
      date: '8 minutes ago',
      messageCount: 2,
      lastMessage: 'AI has revolutionized healthcare through...'
    },
    { 
      id: 2, 
      title: 'Applications of AI in healthcare', 
      date: '8 minutes ago',
      messageCount: 2,
      lastMessage: 'Smart home integration with AI systems...'
    },
    { 
      id: 3, 
      title: 'AI-driven smart home technology', 
      date: '1 hour ago',
      messageCount: 7,
      lastMessage: 'Transportation has been transformed by...'
    },
    { 
      id: 4, 
      title: 'Impact of AI on transportation sector', 
      date: '2 days ago',
      messageCount: 5,
      lastMessage: 'Environmental impacts of AI development...'
    },
    { 
      id: 5, 
      title: 'Considerations on the AI environment...', 
      date: '3 days ago',
      messageCount: 13,
      lastMessage: 'Environmental impacts of AI development...'
    }
  ]);

  const [suggestions] = useState<Suggestion[]>([
    { id: '1', text: 'How has AI transformed healthcare?' },
    { id: '2', text: 'What methodology and data were used in the analysis of AI in Internet of Things (IoT) technologies?' },
    { id: '3', text: 'How is AI optimizing financial decision-making?' }
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load files and user profile on component mount
  useEffect(() => {
    loadFiles();
    loadUserProfile();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await listFiles();
      const files = response.files.map((filename: string) => ({
        name: filename,
        size: 0, // Size not provided by API
        uploadDate: new Date() // Date not provided by API
      }));
      setUploadedFiles(files);
    } catch (error) {
      console.error('Error loading files:', error);
      setError('Failed to load files');
    }
  };

  // New function to load user profile
  const loadUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const profile = await getCurrentUser();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await uploadDocument(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const uploadedFile: UploadedFile = {
        name: response.data.filename,
        size: file.size,
        uploadDate: new Date()
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);
      setCurrentFile(uploadedFile);
      
      // Create blob URL for PDF viewer
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      
      // Reset PDF viewer state
      setPdfZoom(1);
      setPdfRotation(0);
      
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Upload failed. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
    
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };


  const handleRemovePDF = async () => {
    if (!currentFile) return;
    
    try {
      await removeFile(currentFile.name);
      
      // Clean up
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      setUploadedFiles(prev => prev.filter(f => f.name !== currentFile.name));
      setCurrentFile(null);
      setPdfUrl(null);
      setPdfZoom(1);
      setPdfRotation(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error removing file:', error);
      setError('Failed to remove file');
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentFile) return;
    
    try {
      const blob = await downloadFile(currentFile.name);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentFile.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file');
    }
  };

  const handleNewChat = () => {
    setChatHistory([]);
    setUserInput('');
    setCurrentView('chat');
    setIsSidebarOpen(false);
    setError(null);
  };

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || userInput;
    if (!messageToSend.trim()) return;

    const userMessage: ChatMessage = { 
      type: 'user', 
      content: messageToSend, 
      timestamp: new Date(),
      isComprehensive: useComprehensive
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);
    setUserInput('');
    setError(null);

    try {
      const response: QueryResponse | ComprehensiveQueryResponse = useComprehensive
        ? await getComprehensiveAnswer(messageToSend, {
            use_pdf_context: currentFile !== null,
            generate_comprehensive: true,
            max_tokens: 1000,
          })
        : await getAnswer(messageToSend);
    
      const llmResponse: ChatMessage = {
        type: 'llm',
        content: isComprehensiveResponse(response)
          ? response.comprehensive_answer
          : response.response,
        timestamp: new Date(),
        isComprehensive: useComprehensive,
      };
    
      setChatHistory((prev) => [...prev, llmResponse]);
    } catch (error) {
      console.error('Error getting response:', error);
      setError('Failed to get response. Please try again.');
    
      const errorMessage: ChatMessage = {
        type: 'llm',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };
    
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChatSelect = (chatId: number) => {
    setCurrentView('chat');
    setChatHistory([
      { type: 'user', content: 'What are the main applications of AI in healthcare?', timestamp: new Date() },
      { type: 'llm', content: 'Artificial Intelligence (AI) has become increasingly prevalent in healthcare, revolutionizing the way medical professionals interact with the world of medicine. From diagnostics to autonomous treatment protocols, AI has permeated various aspects of healthcare, shaping the way we approach medical care.', timestamp: new Date() }
    ]);
    setIsSidebarOpen(false);
  };

  const handlePdfZoomIn = () => setPdfZoom(prev => Math.min(prev + 0.25, 3));
  const handlePdfZoomOut = () => setPdfZoom(prev => Math.max(prev - 0.25, 0.5));
  const handlePdfRotate = () => setPdfRotation(prev => (prev + 90) % 360);

  const handleLogout = async () => {
    try {
      await logout();
      // Clear user profile data
      setUserProfile(null);
      // Redirect to login or show login form
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Helper function to get user initials for avatar
  const getUserInitials = (fullName: string | undefined) => {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderPDFViewer = () => {
    return (
      <div className="w-1/2 bg-gray-100 flex flex-col border-r border-gray-200">
        {/* PDF Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">
                {currentFile?.name || 'No PDF uploaded'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {pdfUrl && (
                <>
                  <button
                    onClick={handlePdfZoomOut}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">{Math.round(pdfZoom * 100)}%</span>
                  <button
                    onClick={handlePdfZoomIn}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handlePdfRotate}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  {/* <button
                    onClick={handleDownloadPDF}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button> */}
                  <button
                      onClick={handleDownloadConversation}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm"
                    >
                      Download Conversation (.docx)
                    </button>

                  <button
                    onClick={handleRemovePDF}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                    title="Remove PDF"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-teal-600 text-white px-3 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2 text-sm"
                disabled={isUploading}
              >
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Uploading...' : currentFile ? 'Replace' : 'Upload'}</span>
              </button>
            </div>
          </div>
          
          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">{uploadProgress}% uploaded</p>
            </div>
          )}
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {pdfUrl ? (
            <div className="h-full bg-white rounded-lg shadow-sm overflow-hidden">
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title="PDF Viewer"
                style={{
                  transform: `scale(${pdfZoom}) rotate(${pdfRotation}deg)`,
                  transformOrigin: 'top left'
                }}
              />
            </div>
          ) : (
            <div className="h-full bg-white rounded-lg shadow-sm flex items-center justify-center">
              <div className="text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No PDF uploaded</p>
                <p className="text-sm mb-4">Upload a PDF to start analyzing</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Choose File'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'settings':
        return (
          <div className="flex-1 p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Profile */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  {isLoadingProfile ? (
                    <div className="animate-pulse">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                        <div>
                          <div className="h-6 bg-gray-300 rounded w-32 mb-2"></div>
                          <div className="h-4 bg-gray-300 rounded w-48"></div>
                        </div>
                      </div>
                    </div>
                  ) : userProfile ? (
                    <>
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg font-semibold">
                            {getUserInitials(userProfile.full_name)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">{userProfile.full_name}</h3>
                          <p className="text-gray-600">{userProfile.email}</p>
                          <p className="text-sm text-gray-500">@{userProfile.username}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                          <input 
                            type="text" 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                            defaultValue={userProfile.full_name} 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                          <input 
                            type="text" 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                            defaultValue={userProfile.username} 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input 
                            type="email" 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                            defaultValue={userProfile.email} 
                          />
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-700">Account Status</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${userProfile.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {userProfile.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span>Member since: {formatDate(userProfile.created_at)}</span>
                        </div>
                        <button className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                          Save Changes
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-red-600">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>Failed to load profile</p>
                      <button 
                        onClick={loadUserProfile}
                        className="mt-2 text-sm text-teal-600 hover:text-teal-800"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>

                {/* Chat Settings */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Chat Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Use Comprehensive Mode</label>
                      <input
                        type="checkbox"
                        checked={useComprehensive}
                        onChange={(e) => setUseComprehensive(e.target.checked)}
                        className="rounded focus:ring-teal-500 focus:ring-2"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Comprehensive mode provides more detailed responses with better context analysis.
                    </p>
                  </div>
                </div>

                {/* Files */}
                <div className="bg-white rounded-lg shadow-sm border p-6 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Uploaded Files</h3>
                  {uploadedFiles.length === 0 ? (
                    <p className="text-gray-600">No files uploaded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-800">{file.name}</p>
                              <p className="text-sm text-gray-600">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.uploadDate.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              // Remove file logic
                              setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex-1 flex">
            {/* PDF Viewer - only show when sidebar is closed */}
            {!isSidebarOpen && renderPDFViewer()}
            
            {/* Chat Section */}
            <div className={`${!isSidebarOpen ? 'w-1/2' : 'w-full'} flex flex-col bg-white`}>
              {/* Error Display */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-red-700 hover:text-red-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Welcome message with user name */}
              {/* Welcome message with user name */}
              {chatHistory.length === 0 && !isLoading && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-2xl">
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Welcome back{userProfile?.full_name ? `, ${userProfile.full_name.split(' ')[0]}` : ''}!
                      </h2>
                      <p className="text-gray-600">
                        {currentFile 
                          ? `Ready to analyze "${currentFile.name}". Ask me anything about your document!`
                          : 'Upload a PDF document to start analyzing it with AI.'
                        }
                      </p>
                    </div>

                    {/* Suggestions */}
                    {currentFile && (
                      <div className="space-y-3 mb-6">
                        <p className="text-sm font-medium text-gray-700">Try asking:</p>
                        <div className="grid gap-2">
                          {suggestions.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              onClick={() => handleSuggestionClick(suggestion.text)}
                              className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                            >
                              <span className="text-sm text-gray-700">{suggestion.text}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {chatHistory.length > 0 && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-3xl px-4 py-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {message.type === 'llm' && (
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <MessageCircle className="w-4 h-4 text-gray-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            {message.isComprehensive && (
                              <div className="text-xs opacity-75 mb-1">Comprehensive Mode</div>
                            )}
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <div className="text-xs opacity-75 mt-2">
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-3xl px-4 py-3 rounded-lg bg-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  {/* Comprehensive mode toggle */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="comprehensive"
                      checked={useComprehensive}
                      onChange={(e) => setUseComprehensive(e.target.checked)}
                      className="rounded focus:ring-teal-500 focus:ring-2"
                    />
                    <label htmlFor="comprehensive" className="text-sm text-gray-600">
                      Comprehensive
                    </label>
                  </div>
                  
                  <div className="flex-1 relative">
                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={currentFile ? "Ask about your document..." : "Upload a PDF first..."}
                      disabled={!currentFile || isLoading}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                      rows={1}
                    />
                  </div>
                  
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!userInput.trim() || !currentFile || isLoading}
                    className="bg-teal-600 text-white p-3 rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const renderSidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">PDF Chat AI</h1>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={handleNewChat}
          className="w-full bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="px-4 pb-4">
        <nav className="space-y-2">
          <button
            onClick={() => {
              setCurrentView('chat');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'chat' ? 'bg-teal-100 text-teal-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Current Chat</span>
          </button>
          <button
            onClick={() => {
              setCurrentView('allChats');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'allChats' ? 'bg-teal-100 text-teal-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>Chat History</span>
          </button>
          <button
            onClick={() => {
              setCurrentView('settings');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'settings' ? 'bg-teal-100 text-teal-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Previous Chats */}
      {currentView === 'allChats' && (
        <div className="flex-1 overflow-y-auto px-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Chats</h3>
          <div className="space-y-2">
            {previousChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleChatSelect(chat.id)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-800 truncate">{chat.title}</h4>
                    <p className="text-xs text-gray-600 mt-1 truncate">{chat.lastMessage}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-gray-500">{chat.date}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{chat.messageCount} messages</span>
                    </div>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* User Profile Footer */}
      <div className="border-t border-gray-200 p-4">
        {userProfile ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {getUserInitials(userProfile.full_name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{userProfile.full_name}</p>
              <p className="text-xs text-gray-600 truncate">{userProfile.email}</p>
            </div>
            <button
              onClick={() => {
                setCurrentView('settings');
                setIsSidebarOpen(false);
              }}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <div className="animate-pulse flex space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePDFUpload}
        accept=".pdf"
        className="hidden"
      />

      {/* Sidebar */}
      {renderSidebar()}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800">
                {currentView === 'chat' ? 'Chat' : 
                 currentView === 'allChats' ? 'Chat History' : 
                 'Settings'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {userProfile && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {getUserInitials(userProfile.full_name)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">{userProfile.full_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {renderMainContent()}
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;