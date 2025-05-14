import React, { useState, useEffect } from 'react';
import { 
  Avatar, 
  Card, 
  Tabs, 
  List, 
  Tag, 
  Button, 
  Row, 
  Col,
  Empty,
  Skeleton,
  Dropdown,
  Modal,
  Input,
  Upload,
  Image,
  Form
} from 'antd';
import { 
  MessageOutlined, 
  BookOutlined, 
  UserOutlined, 
  EditOutlined,
  LinkOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  CrownOutlined,
  EllipsisOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  MailOutlined,
  CameraOutlined,
  LockOutlined
} from '@ant-design/icons';
import { auth, database } from '../database/firebaseConfig';
import { ref, onValue, get, set, serverTimestamp } from 'firebase/database';
import moment from 'moment';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { updateProfile, updatePassword, signOut } from 'firebase/auth';

const { TabPane } = Tabs;

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const Profile = () => {
  const [user, setUser] = useState(null);
  const [forumPosts, setForumPosts] = useState([]);
  const [studyResources, setStudyResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUserId = auth.currentUser?.uid;
  const [editingPost, setEditingPost] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editingResource, setEditingResource] = useState(null);
  const [editResourceContent, setEditResourceContent] = useState('');
  const [editResourceLink, setEditResourceLink] = useState('');
  const [editResourceCategory, setEditResourceCategory] = useState('');
  const { confirm } = Modal;
  const [editImages, setEditImages] = useState([]);
  const [editFileList, setEditFileList] = useState([]);
  const [editResourceFiles, setEditResourceFiles] = useState([]);
  const [editAttachments, setEditAttachments] = useState([]);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editProfilePic, setEditProfilePic] = useState(null);
  const [editProfilePicUrl, setEditProfilePicUrl] = useState('');
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [form] = Form.useForm();
  const location = useLocation();

  // Fetch user data
  useEffect(() => {
    const targetUserId = userId || currentUserId;
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    const userRef = ref(database, `users/${targetUserId}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      if (userData) {
        setUser({
          ...userData,
          uid: targetUserId
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, currentUserId]);

  // Fetch user's forum posts
  useEffect(() => {
    const targetUserId = userId || currentUserId;
    if (!targetUserId) return;

    const postsRef = ref(database, 'posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const postsData = snapshot.val();
      if (postsData) {
        const userPosts = Object.entries(postsData)
          .map(([id, post]) => ({ id, ...post }))
          .filter(post => post.author.uid === targetUserId)
          .sort((a, b) => b.timestamp - a.timestamp);
        setForumPosts(userPosts);
      } else {
        setForumPosts([]);
      }
    });

    return () => unsubscribe();
  }, [userId, currentUserId]);

  // Fetch user's study resources
  useEffect(() => {
    const targetUserId = userId || currentUserId;
    if (!targetUserId) return;

    const resourcesRef = ref(database, 'study-resources');
    const unsubscribe = onValue(resourcesRef, (snapshot) => {
      const resourcesData = snapshot.val();
      if (resourcesData) {
        const userResources = Object.entries(resourcesData)
          .map(([id, resource]) => ({ id, ...resource }))
          .filter(resource => resource.author.uid === targetUserId)
          .sort((a, b) => b.timestamp - a.timestamp);
        setStudyResources(userResources);
      } else {
        setStudyResources([]);
      }
    });

    return () => unsubscribe();
  }, [userId, currentUserId]);

  // Add effect to prevent back navigation after password change
  useEffect(() => {
    const preventBackNavigation = (e) => {
      if (location.state?.passwordChanged) {
        e.preventDefault();
        window.history.forward();
      }
    };

    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', preventBackNavigation);

    return () => {
      window.removeEventListener('popstate', preventBackNavigation);
    };
  }, [location]);

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

  const uploadImageToCloudinary = async (file) => {
    if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || !import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
      console.error('Cloudinary configuration missing');
      throw new Error('Cloudinary configuration is not properly set up');
    }

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
        const errorData = await response.text();
        console.error('Cloudinary upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Upload failed: ${response.statusText}. ${errorData}`);
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

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
        type: file.type.startsWith('image/') ? 'image' : 'pdf',
        name: file.name
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleEditPost = async () => {
    try {
      if (!editingPost || !editPostContent.trim()) {
        message.error('Content cannot be empty');
        return;
      }

      const postRef = ref(database, `posts/${editingPost.id}`);
      const postSnapshot = await get(postRef);
      const currentPost = postSnapshot.val();

      if (!currentPost) {
        message.error('Post not found');
        return;
      }

      // Upload new images if any
      const imageUrls = [...(editingPost.images || [])]; // Keep existing images
      if (editImages.length > 0) {
        for (const file of editImages) {
          if (file && file.originFileObj) {
            const imageUrl = await uploadImageToCloudinary(file.originFileObj);
            if (imageUrl) {
              imageUrls.push(imageUrl);
            }
          }
        }
      }

      await set(postRef, {
        ...currentPost,
        content: editPostContent.trim(),
        images: imageUrls,
        editedAt: serverTimestamp()
      });

      setEditingPost(null);
      setEditPostContent('');
      setEditImages([]);
      setEditFileList([]);
      message.success('Post updated successfully!');
    } catch (error) {
      console.error('Error updating post:', error);
      message.error('Failed to update post. Please try again.');
    }
  };

  const handleEditResource = async () => {
    try {
      setLoading(true);
      if (!editingResource || !editResourceContent.trim()) {
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
      if (editResourceFiles.length > 0) {
        for (const file of editResourceFiles) {
          if (file.originFileObj) {
            const fileData = await uploadFileToCloudinary(file.originFileObj);
            newFileUrls.push(fileData);
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
        content: editResourceContent.trim(),
        link: editResourceLink.trim(),
        category: editResourceCategory,
        attachments: updatedAttachments,
        editedAt: serverTimestamp()
      });

      setEditingResource(null);
      setEditResourceContent('');
      setEditResourceLink('');
      setEditResourceCategory('');
      setEditResourceFiles([]);
      setEditAttachments([]);
      message.success('Resource updated successfully!');
    } catch (error) {
      console.error('Error updating resource:', error);
      message.error('Failed to update resource. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const postRef = ref(database, `posts/${postId}`);
      await set(postRef, null);
      message.success('Post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error);
      message.error('Failed to delete post. Please try again.');
    }
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

  const showDeleteConfirm = (itemId, itemType) => {
    confirm({
      title: `Are you sure you want to delete this ${itemType}?`,
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        if (itemType === 'post') {
          handleDeletePost(itemId);
        } else {
          handleDeleteResource(itemId);
        }
      },
    });
  };

  const getPostActions = (post) => {
    if (!auth.currentUser || post.author.uid !== auth.currentUser.uid) {
      return null;
    }

    return [
      {
        key: 'edit',
        label: 'Edit Post',
        icon: <EditOutlined />,
        onClick: () => {
          setEditingPost(post);
          setEditPostContent(post.content);
        }
      },
      {
        key: 'delete',
        label: 'Delete Post',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => showDeleteConfirm(post.id, 'post')
      }
    ];
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
          setEditResourceContent(resource.content);
          setEditResourceLink(resource.link || '');
          setEditResourceCategory(resource.category);
          setEditAttachments(resource.attachments || []);
          setEditResourceFiles([]);
        }
      },
      {
        key: 'delete',
        label: 'Delete Resource',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => showDeleteConfirm(resource.id, 'resource')
      }
    ];
  };

  const handleRemoveEditImage = (indexToRemove) => {
    const updatedImages = editingPost.images.filter((_, index) => index !== indexToRemove);
    setEditingPost({ ...editingPost, images: updatedImages });
  };

  const handleRemoveEditFile = (indexToRemove) => {
    const updatedAttachments = editAttachments.filter((_, index) => index !== indexToRemove);
    setEditAttachments(updatedAttachments);
  };

  const handleEditUploadChange = ({ fileList: newFileList }) => {
    setEditResourceFiles(newFileList);
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }

    return false; // Return false to prevent auto upload
  };

  const beforeUploadResource = (file) => {
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

  const handleEditProfile = async () => {
    try {
      setEditProfileLoading(true);
      if (!editName.trim()) {
        message.error('Name cannot be empty');
        return;
      }

      // Initialize photoURL with current value or empty string
      let photoURL = user.photoURL || '';

      // If there's a new profile picture, upload it first
      if (editProfilePic) {
        try {
          const formData = new FormData();
          formData.append('file', editProfilePic);
          formData.append('upload_preset', UPLOAD_PRESET);
          formData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

          const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload profile picture');
          }

          const data = await response.json();
          photoURL = data.secure_url; // Update photoURL with the new Cloudinary URL
        } catch (error) {
          console.error('Error uploading profile picture:', error);
          message.error('Failed to upload profile picture. Please try again.');
          return;
        }
      }

      // Only proceed with updates if we have a valid photoURL
      if (!photoURL) {
        message.error('Profile picture URL is required');
        return;
      }

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: editName.trim(),
        photoURL: photoURL
      });

      // Update user data in Realtime Database
      const userRef = ref(database, `users/${currentUserId}`);
      await set(userRef, {
        ...user,
        name: editName.trim(),
        school: editSchool.trim() || '',
        photoURL
      });

      // Update posts author information and comments
      const postsRef = ref(database, 'posts');
      const postsSnapshot = await get(postsRef);
      const posts = postsSnapshot.val();
      
      if (posts) {
        // Update each post individually
        for (const [postId, post] of Object.entries(posts)) {
          if (post.author.uid === currentUserId) {
            const postRef = ref(database, `posts/${postId}`);
            const updatedPost = {
              ...post,
              author: {
                ...post.author,
                name: editName.trim(),
                photoURL: photoURL
              }
            };
            await set(postRef, updatedPost);
          }

          // Update comments if they exist
          if (post.comments) {
            const updatedComments = { ...post.comments };
            let hasUpdates = false;

            for (const [commentId, comment] of Object.entries(post.comments)) {
              if (comment.author.uid === currentUserId) {
                updatedComments[commentId] = {
                  ...comment,
                  author: {
                    ...comment.author,
                    name: editName.trim(),
                    photoURL: photoURL
                  }
                };
                hasUpdates = true;
              }
            }

            if (hasUpdates) {
              const commentsRef = ref(database, `posts/${postId}/comments`);
              await set(commentsRef, updatedComments);
            }
          }
        }
      }

      // Update study resources author information
      const resourcesRef = ref(database, 'study-resources');
      const resourcesSnapshot = await get(resourcesRef);
      const resources = resourcesSnapshot.val();
      
      if (resources) {
        // Update each resource individually
        for (const [resourceId, resource] of Object.entries(resources)) {
          if (resource.author.uid === currentUserId) {
            const resourceRef = ref(database, `study-resources/${resourceId}`);
            const updatedResource = {
              ...resource,
              author: {
                ...resource.author,
                name: editName.trim(),
                photoURL: photoURL
              }
            };
            await set(resourceRef, updatedResource);
          }
        }
      }

      setEditProfileVisible(false);
      setEditProfilePic(null);
      setEditProfilePicUrl('');
      message.success('Profile updated successfully!');

      // Force a re-render of the current user's avatar
      auth.currentUser.reload();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile. Please try again.');
    } finally {
      setEditProfileLoading(false);
    }
  };

  const beforeUploadProfilePic = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return false;
    }

    // Set the file directly
    setEditProfilePic(file);

    // Preview the image
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditProfilePicUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    return false; // Prevent auto upload
  };

  const handleChangePassword = async (values) => {
    try {
      setChangePasswordLoading(true);
      
      if (values.newPassword !== values.confirmPassword) {
        message.error('Passwords do not match');
        return;
      }

      await updatePassword(auth.currentUser, values.newPassword);
      
      message.success('Password updated successfully! Please login again.');
      setChangePasswordVisible(false);
      form.resetFields();

      // Sign out the user
      await signOut(auth);

      // Navigate to home with state to prevent back navigation
      navigate('/', { 
        replace: true,
        state: { passwordChanged: true }
      });

    } catch (error) {
      console.error('Error updating password:', error);
      message.error('Failed to update password. Please try again.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Define tab items
  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <MessageOutlined />
          Forum Posts
        </span>
      ),
      children: (
        <List
          itemLayout="vertical"
          dataSource={forumPosts}
          locale={{ emptyText: <Empty description="No forum posts yet" /> }}
          renderItem={post => (
            <List.Item className="!px-0">
              <Card className="w-full hover:shadow-md transition-shadow">
                <div className="flex justify-between">
                  <div className="flex-grow space-y-2">
                    <p className="text-gray-600 whitespace-pre-wrap">{post.content}</p>
                    
                    {post.images && post.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {post.images.map((imageUrl, index) => (
                          <img
                            key={index}
                            src={imageUrl}
                            alt={`Post image ${index + 1}`}
                            className="rounded-lg object-cover aspect-square w-full"
                          />
                        ))}
                      </div>
                    )}

                    {post.files && post.files.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                        {post.files.map((file, index) => (
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

                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <div>
                        {moment(post.timestamp).fromNow()}
                        {post.editedAt && ' (edited)'}
                      </div>
                      <div>
                        {post.comments && `${Object.keys(post.comments).length} comments`}
                      </div>
                    </div>
                  </div>

                  {auth.currentUser && post.author.uid === auth.currentUser.uid && (
                    <Dropdown
                      menu={{ items: getPostActions(post) }}
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
            </List.Item>
          )}
        />
      )
    },
    {
      key: '2',
      label: (
        <span>
          <BookOutlined />
          Study Resources
        </span>
      ),
      children: (
        <List
          itemLayout="vertical"
          dataSource={studyResources}
          locale={{ emptyText: <Empty description="No study resources shared yet" /> }}
          renderItem={resource => (
            <List.Item className="!px-0">
              <Card className="w-full hover:shadow-md transition-shadow">
                <div className="flex justify-between">
                  <div className="flex-grow space-y-3">
                    <div>
                      <Tag color="blue" className="mb-2">{resource.category}</Tag>
                      <p className="text-gray-600 whitespace-pre-wrap">{resource.content}</p>
                    </div>

                    {resource.link && (
                      <a 
                        href={resource.link}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="block p-2 bg-blue-50 rounded-lg text-blue-600 hover:text-blue-800 text-sm break-all"
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
                            className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors text-center group"
                          >
                            {file.type === 'pdf' ? (
                              <FilePdfOutlined className="text-2xl text-red-500 group-hover:text-red-600" />
                            ) : (
                              <FileImageOutlined className="text-2xl text-green-500 group-hover:text-green-600" />
                            )}
                            <div className="mt-1 text-xs truncate">{file.name}</div>
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      {moment(resource.timestamp).fromNow()}
                      {resource.editedAt && ' (edited)'}
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
            </List.Item>
          )}
        />
      )
    }
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="mb-6 shadow-lg">
          <Skeleton avatar active paragraph={{ rows: 4 }} />
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Empty
          description="User not found"
          className="py-8"
        >
          <Button type="primary" onClick={() => navigate('/')}>
            Go Home
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* User Profile Section */}
      <Card className="mb-6 shadow-lg">
        <Row gutter={24} align="middle">
          <Col xs={24} md={6} className="text-center mb-4">
            <Avatar 
              size={128} 
              src={user.photoURL}
              icon={<UserOutlined />}
              className="mb-4"
            />
            {currentUserId === user.uid && (
              <div className="space-y-2">
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              className="w-full"
                  onClick={() => {
                    setEditName(user.name || '');
                    setEditSchool(user.school || '');
                    setEditProfilePicUrl(user.photoURL || '');
                    setEditProfileVisible(true);
                  }}
            >
              Edit Profile
            </Button>
                <Button 
                  type="default" 
                  icon={<LockOutlined />}
                  className="w-full"
                  onClick={() => setChangePasswordVisible(true)}
                >
                  Change Password
                </Button>
              </div>
            )}
          </Col>
          
          <Col xs={24} md={18}>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              {getRoleBadge(user.role)}
            </div>
            <div className="space-y-1 mb-4 text-gray-600">
              <p className="flex items-center gap-2">
                <BookOutlined className="text-blue-500" />
                {user.school || 'No school provided'}
              </p>
              <p className="flex items-center gap-2">
                <MailOutlined className="text-blue-500" />
                {user.email || 'No email provided'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                title="Forum Posts" 
                value={forumPosts.length} 
                color="#1890ff"
              />
              <StatCard 
                title="Study Resources" 
                value={studyResources.length} 
                color="#52c41a"
              />
              <StatCard 
                title="Comments" 
                value={forumPosts.reduce((total, post) => 
                  total + (post.comments ? Object.keys(post.comments).length : 0), 0)} 
                color="#faad14"
              />
              <StatCard 
                title="Files Shared" 
                value={studyResources.reduce((total, resource) => 
                  total + (resource.attachments ? resource.attachments.length : 0), 0)} 
                color="#f5222d"
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* Edit Post Modal */}
      <Modal
        title="Edit Post"
        open={editingPost !== null}
        onOk={handleEditPost}
        onCancel={() => {
          setEditingPost(null);
          setEditPostContent('');
          setEditImages([]);
          setEditFileList([]);
        }}
        okText="Save"
        cancelText="Cancel"
        width={600}
      >
        <Input.TextArea
          value={editPostContent}
          onChange={(e) => setEditPostContent(e.target.value)}
          rows={4}
          className="mt-2 mb-4"
        />

        {/* Existing Images */}
        {editingPost?.images && editingPost.images.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">Current Images:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {editingPost.images.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={imageUrl}
                    alt={`Image ${index + 1}`}
                    className="rounded-lg object-cover aspect-square w-full"
                  />
                  <Button
                    type="text"
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveEditImage(index)}
                    icon={<DeleteOutlined />}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Images */}
                    <div>
          <div className="text-sm font-medium mb-2">Add New Images:</div>
          <Upload
            multiple
            showUploadList={true}
            beforeUpload={beforeUpload}
            onChange={({ fileList }) => {
              setEditFileList(fileList);
              setEditImages(fileList);
            }}
            fileList={editFileList}
            maxCount={4 - (editingPost?.images?.length || 0)}
            accept="image/*"
          >
            <Button 
              icon={<PlusOutlined />}
              disabled={editingPost?.images?.length >= 4 || editFileList.length >= 4}
            >
              Add Images ({(editingPost?.images?.length || 0) + editFileList.length}/4)
            </Button>
          </Upload>
                    </div>
      </Modal>

      {/* Edit Resource Modal */}
      <Modal
        title="Edit Resource"
        open={editingResource !== null}
        onOk={handleEditResource}
        onCancel={() => {
          setEditingResource(null);
          setEditResourceContent('');
          setEditResourceLink('');
          setEditResourceCategory('');
          setEditResourceFiles([]);
          setEditAttachments([]);
        }}
        okText="Save"
        cancelText="Cancel"
        width={600}
        confirmLoading={loading}
      >
        <div className="space-y-4">
          <Input.TextArea
            value={editResourceContent}
            onChange={(e) => setEditResourceContent(e.target.value)}
            placeholder="Resource content"
            rows={4}
            className="text-sm"
          />
          
          <Input
            prefix={<LinkOutlined className="text-gray-400" />}
            value={editResourceLink}
            onChange={(e) => setEditResourceLink(e.target.value)}
            placeholder="Resource link (optional)"
            className="text-sm"
          />

          <select
            className="w-full border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={editResourceCategory}
            onChange={(e) => setEditResourceCategory(e.target.value)}
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
                        <div className="aspect-square">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
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
              beforeUpload={beforeUploadResource}
              onChange={handleEditUploadChange}
              fileList={editResourceFiles}
              maxCount={4 - (editAttachments?.length || 0)}
              accept="image/*,.pdf"
              disabled={editAttachments?.length >= 4}
            >
              <Button 
                icon={<PlusOutlined />}
                disabled={editAttachments?.length >= 4}
                className="text-sm"
              >
                Add Files ({(editAttachments?.length || 0) + editResourceFiles.length}/4)
              </Button>
            </Upload>
          </div>
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile"
        open={editProfileVisible}
        onOk={handleEditProfile}
        onCancel={() => {
          setEditProfileVisible(false);
          setEditProfilePic(null);
          setEditProfilePicUrl('');
        }}
        okText="Save"
        cancelText="Cancel"
        confirmLoading={editProfileLoading}
      >
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="relative inline-block group">
              <Avatar 
                size={100}
                src={editProfilePicUrl || user.photoURL}
                icon={<UserOutlined />}
                className="mb-2"
              />
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={beforeUploadProfilePic}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 rounded-full transition-opacity cursor-pointer"
              >
                <div className="text-white text-center">
                  <CameraOutlined className="text-xl" />
                  <div className="text-xs mt-1">Change</div>
                </div>
              </Upload>
            </div>
          </div>

                    <div>
            <div className="text-sm font-medium mb-1">Name *</div>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter your name"
              className="w-full"
            />
                    </div>

          <div>
            <div className="text-sm font-medium mb-1">School</div>
            <Input
              value={editSchool}
              onChange={(e) => setEditSchool(e.target.value)}
              placeholder="Enter your school"
              className="w-full"
            />
                      </div>
                    </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title="Change Password"
        open={changePasswordVisible}
        onCancel={() => {
          setChangePasswordVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleChangePassword}
          className="mt-4"
        >
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter your new password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Enter new password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Confirm new password"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button 
                onClick={() => {
                  setChangePasswordVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={changePasswordLoading}
              >
                Update Password
              </Button>
                  </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Activity Tabs */}
      <Tabs defaultActiveKey="1" items={tabItems} className="shadow-lg" />
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div 
    className="p-4 rounded-lg" 
    style={{ backgroundColor: color + '10', border: `1px solid ${color}20` }}
  >
    <div className="text-xl font-bold" style={{ color }}>
      {value}
    </div>
    <div className="text-gray-600">{title}</div>
  </div>
);

export default Profile;