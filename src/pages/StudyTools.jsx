import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Avatar, 
  Tag, 
  Button, 
  Upload,
  message,
  Input,
  Modal,
  Dropdown
} from 'antd';
import {   LinkOutlined, 
  FilePdfOutlined, 
  FileImageOutlined, 
  PlusOutlined,
  DeleteOutlined,
  UserOutlined,
  EditOutlined,
  EllipsisOutlined,
  ExclamationCircleOutlined,
  CrownOutlined,
  BookOutlined
} from '@ant-design/icons';
import { auth, database } from '../database/firebaseConfig';
import { ref, push, set, onValue, serverTimestamp, get } from 'firebase/database';
import moment from 'moment';
import { useParams, useNavigate } from 'react-router-dom';

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const StudyTools = () => {
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({ 
    content: '', 
    link: '',
    category: 'Chemistry',
    files: [] 
  });
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const { userId } = useParams();
  const [editingResource, setEditingResource] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editFileList, setEditFileList] = useState([]);
  const [editAttachments, setEditAttachments] = useState([]);
  const { confirm } = Modal;
  const navigate = useNavigate();

  // Fetch resources from Firebase
  useEffect(() => {
    const resourcesRef = ref(database, 'study-resources');
    const unsubscribe = onValue(resourcesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const resourcesArray = Object.entries(data).map(([id, resource]) => ({
          id,
          ...resource
        })).sort((a, b) => b.timestamp - a.timestamp);
        setResources(resourcesArray);
      } else {
        setResources([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch user name and role from database
  useEffect(() => {
    if (auth.currentUser) {
      const userRef = ref(database, `users/${auth.currentUser.uid}`);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          setUserName(userData.name);
          setUserRole(userData.role);
        }
      });
    }
  }, [auth.currentUser]);

  // Function to upload file to Cloudinary
  const uploadFileToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

    try {
      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return {
        url: data.secure_url,
        type: file.type.startsWith('image/') ? 'image' : 'pdf'
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleCreateResource = async () => {
    try {
      setLoading(true);
      if (!auth.currentUser) {
        message.error('Please login to share resources');
        return;
      }

      if (!userName) {
        message.error('Please set your name in your profile before posting');
        return;
      }

      if (!newResource.content.trim()) {
        message.error('Please add a description');
        return;
      }

      // Upload files to Cloudinary
      const fileUrls = [];
      if (fileList.length > 0) {
        for (const file of fileList) {
          const fileData = await uploadFileToCloudinary(file.originFileObj);
          fileUrls.push({
            ...fileData,
            name: file.name
          });
        }
      }

      // Create resource data
      const resourceData = {
        content: newResource.content.trim(),
        link: newResource.link.trim(),
        category: newResource.category,
        timestamp: serverTimestamp(),
        author: {
          uid: auth.currentUser.uid,
          name: userName,
          photoURL: auth.currentUser.photoURL || null,
          role: userRole
        },
        attachments: fileUrls
      };

      // Save to Firebase
      const resourcesRef = ref(database, 'study-resources');
      const newResourceRef = push(resourcesRef);
      await set(newResourceRef, resourceData);

      // Clear form
      setNewResource({ 
        content: '', 
        link: '',
        category: 'Chemistry',
        files: [] 
      });
      setFileList([]);
      message.success('Resource shared successfully!');
    } catch (error) {
      console.error('Error sharing resource:', error);
      message.error('Failed to share resource. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (file) => {
    const isImageOrPdf = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!isImageOrPdf) {
      message.error('You can only upload images or PDF files!');
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('File must be smaller than 10MB!');
      return false;
    }

    return false; // Return false to handle upload manually
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handleEditResource = async () => {
    try {
      setLoading(true);
      if (!editingResource || !editContent.trim()) {
        message.error('Content cannot be empty');
        return;
      }

      const resourceRef = ref(database, `study-resources/${editingResource.id}`);
      const resourceSnapshot = await get(resourceRef);
      const currentResource = resourceSnapshot.val();

      if (!currentResource) {
        message.error('Resource not found');
        return;
      }

      // Upload new files if any
      const newFileUrls = [];
      if (editFileList.length > 0) {
        for (const file of editFileList) {
          if (file.originFileObj) {
            const fileData = await uploadFileToCloudinary(file.originFileObj);
            newFileUrls.push({
              ...fileData,
              name: file.name
            });
          }
        }
      }

      // Combine existing attachments with new ones
      const updatedAttachments = [
        ...editAttachments,
        ...newFileUrls
      ];

      await set(resourceRef, {
        ...currentResource,
        content: editContent.trim(),
        link: editLink.trim(),
        category: editCategory,
        attachments: updatedAttachments,
        editedAt: serverTimestamp()
      });

      setEditingResource(null);
      setEditContent('');
      setEditLink('');
      setEditCategory('');
      setEditFileList([]);
      setEditAttachments([]);
      message.success('Resource updated successfully!');
    } catch (error) {
      console.error('Error updating resource:', error);
      message.error('Failed to update resource. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEditFile = (indexToRemove) => {
    const updatedAttachments = editAttachments.filter((_, index) => index !== indexToRemove);
    setEditAttachments(updatedAttachments);
  };

  const handleEditUploadChange = ({ fileList: newFileList }) => {
    setEditFileList(newFileList);
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      const resourceRef = ref(database, `study-resources/${resourceId}`);
      await set(resourceRef, null);
      message.success('Resource deleted successfully!');
    } catch (error) {
      console.error('Error deleting resource:', error);
      message.error('Failed to delete resource. Please try again.');
    }
  };

  const showDeleteConfirm = (resourceId) => {
    confirm({
      title: 'Are you sure you want to delete this resource?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        handleDeleteResource(resourceId);
      },
    });
  };

  const getResourceActions = (resource) => {
    if (!auth.currentUser || resource.author.uid !== auth.currentUser.uid) {
      return null;
    }

    return [
      {
        key: 'edit',
        label: 'Edit Resource',
        icon: <EditOutlined />,
        onClick: () => {
          setEditingResource(resource);
          setEditContent(resource.content);
          setEditLink(resource.link || '');
          setEditCategory(resource.category);
          setEditAttachments(resource.attachments || []);
          setEditFileList([]);
        }
      },
      {
        key: 'delete',
        label: 'Delete Resource',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => showDeleteConfirm(resource.id)
      }
    ];
  };

  const getRoleBadge = (role) => {
    if (!role) return null;
    
    switch(role.toLowerCase()) {
      case 'teacher':
        return (
          <Tag 
            icon={<CrownOutlined />} 
            color="gold"
            className="ml-1 text-xs font-medium"
          >
            Teacher
          </Tag>
        );
      case 'student':
        return (
          <Tag 
            icon={<BookOutlined />} 
            color="blue"
            className="ml-1 text-xs font-medium"
          >
            Student
          </Tag>
        );
      default:
        return null;
    }
  };

  const handleProfileClick = (authorId) => {
    if (!auth.currentUser) {
      console.log('No user logged in');
      return;
    }

    console.log('Current User ID:', auth.currentUser.uid);
    console.log('Clicked Author ID:', authorId);

    if (authorId === auth.currentUser.uid) {
      // Navigate to own profile
      console.log('Navigating to own profile:', `/profile/${authorId}`);
      navigate(`/profile/${authorId}`);
    } else {
      // Navigate to view other user's profile
      const path = `/study-tools/${auth.currentUser.uid}/view/${authorId}`;
      console.log('Navigating to view profile:', path);
      navigate(path);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-3xl">
      {/* Create Resource Section */}
      <Card className="mb-4 md:mb-6 shadow-sm rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Avatar 
            src={auth.currentUser?.photoURL}
            icon={<UserOutlined />}
            size={40}
            className="flex-shrink-0"
          />
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{userName}</span>
            {getRoleBadge(userRole)}
          </div>
        </div>
        
        <div className="space-y-4">
          <textarea
            placeholder="Share your study materials, resources, or insights..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none min-h-[100px]"
            value={newResource.content}
            onChange={(e) => setNewResource({...newResource, content: e.target.value})}
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              prefix={<LinkOutlined className="text-gray-400" />}
              placeholder="Add resource link (optional)"
              className="flex-grow text-sm"
              value={newResource.link}
              onChange={(e) => setNewResource({...newResource, link: e.target.value})}
            />
            
            <select
              className="border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={newResource.category}
              onChange={(e) => setNewResource({...newResource, category: e.target.value})}
            >
              <option>Chemistry</option>
              <option>Programming</option>
              <option>History</option>
              <option>Mathematics</option>
              <option>Physics</option>
              <option>Biology</option>
              <option>Literature</option>
              <option>Other</option>
            </select>
          </div>

          <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2">
            <Upload
              multiple
              showUploadList={true}
              beforeUpload={beforeUpload}
              onChange={handleUploadChange}
              fileList={fileList}
              maxCount={4}
              accept="image/*,.pdf"
              className="w-full xs:w-auto"
            >
              <Button 
                icon={<PlusOutlined />}
                className="w-full xs:w-auto text-sm"
              >
                Add Files ({fileList.length}/4)
              </Button>
            </Upload>
          
          <Button 
            type="primary" 
              onClick={handleCreateResource}
              loading={loading}
              disabled={!newResource.content.trim()}
              className="w-full xs:w-auto text-sm"
            >
              Share Resource
          </Button>
          </div>
        </div>
      </Card>

      {/* Edit Resource Modal */}
      <Modal
        title="Edit Resource"
        open={editingResource !== null}
        onOk={handleEditResource}
        onCancel={() => {
          setEditingResource(null);
          setEditContent('');
          setEditLink('');
          setEditCategory('');
          setEditFileList([]);
          setEditAttachments([]);
        }}
        okText="Save"
        cancelText="Cancel"
        width={600}
        confirmLoading={loading}
      >
        <div className="space-y-4">
          <Input.TextArea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Resource content"
            rows={4}
            className="text-sm"
          />
          
          <Input
            prefix={<LinkOutlined className="text-gray-400" />}
            value={editLink}
            onChange={(e) => setEditLink(e.target.value)}
            placeholder="Resource link (optional)"
            className="text-sm"
          />

          <select
            className="w-full border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
          >
            <option>Chemistry</option>
            <option>Programming</option>
            <option>History</option>
            <option>Mathematics</option>
            <option>Physics</option>
            <option>Biology</option>
            <option>Literature</option>
            <option>Other</option>
          </select>

          {/* Existing Files */}
          {editAttachments && editAttachments.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Current Files:</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {editAttachments.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="p-3 border rounded-lg">
                      {file.type === 'pdf' ? (
                        <FilePdfOutlined className="text-2xl text-red-500" />
                      ) : (
                        <FileImageOutlined className="text-2xl text-green-500" />
                      )}
                      <div className="mt-1 text-xs truncate">{file.name}</div>
                    </div>
                    <Button
                      type="text"
                      className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveEditFile(index)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Files */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Add New Files:</div>
            <Upload
              multiple
              showUploadList={true}
              beforeUpload={beforeUpload}
              onChange={handleEditUploadChange}
              fileList={editFileList}
              maxCount={4 - (editAttachments?.length || 0)}
              accept="image/*,.pdf"
              disabled={editAttachments?.length >= 4}
            >
              <Button 
                icon={<PlusOutlined />}
                disabled={editAttachments?.length >= 4}
                className="text-sm"
              >
                Add Files ({(editAttachments?.length || 0) + editFileList.length}/4)
              </Button>
            </Upload>
          </div>
        </div>
      </Modal>

      {/* Resources List */}
      <List
        itemLayout="vertical"
        dataSource={resources}
        renderItem={resource => (
          <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-grow">
                <Avatar 
                  src={resource.author.photoURL}
                  icon={<UserOutlined />}
                  size={40}
                  className="flex-shrink-0 cursor-pointer"
                  onClick={() => handleProfileClick(resource.author.uid)}
                />
                <div className="flex-grow min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span 
                      className="font-medium text-sm cursor-pointer hover:text-blue-500"
                      onClick={() => handleProfileClick(resource.author.uid)}
                    >
                      {resource.author.name}
                    </span>
                    {getRoleBadge(resource.author.role)}
                    <Tag color="blue" className="text-xs">{resource.category}</Tag>
                    <span className="text-gray-500 text-xs">
                      {moment(resource.timestamp).fromNow()}
                      {resource.editedAt && ' (edited)'}
                    </span>
              </div>

                  <p className="text-sm text-gray-800 mt-2 mb-3 whitespace-pre-wrap">{resource.content}</p>

                  {resource.link && (
                    <a 
                      href={resource.link}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="block mb-3 p-2 bg-blue-50 rounded-lg text-blue-600 hover:text-blue-800 text-sm break-all"
                    >
                      <LinkOutlined className="mr-2" />
                      {resource.link}
                    </a>
                  )}

                  {resource.attachments && resource.attachments.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {resource.attachments.map((file, index) => (
                        <a
                      key={index}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                    >
                      {file.type === 'pdf' ? (
                            <FilePdfOutlined className="text-2xl text-red-500" />
                      ) : (
                            <FileImageOutlined className="text-2xl text-green-500" />
                      )}
                          <div className="mt-1 text-xs truncate">{file.name}</div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {auth.currentUser && resource.author.uid === auth.currentUser.uid && (
                <Dropdown
                  menu={{ items: getResourceActions(resource) }}
                  placement="bottomRight"
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    icon={<EllipsisOutlined />}
                    className="text-gray-500 hover:text-gray-700"
                  />
                </Dropdown>
              )}
              </div>
            </Card>
        )}
      />
    </div>
  );
};

export default StudyTools;