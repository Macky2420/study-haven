import React, { useState, useEffect } from 'react';
import { Card, Avatar, Button, Upload, Image, Tooltip, Badge, message, Empty, Tag, Dropdown, Modal, Input } from 'antd';
import { 
  LikeOutlined,
  LikeFilled,
  MessageOutlined, 
  UserOutlined, 
  CrownOutlined,
  PlusOutlined,
  DeleteOutlined,
  BookOutlined,
  EditOutlined,
  EllipsisOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { auth, database } from '../database/firebaseConfig';
import { ref, push, set, onValue, serverTimestamp, get } from 'firebase/database';
import { useParams, useNavigate } from 'react-router-dom';

const { Meta } = Card;

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const Forum = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ content: '', images: [] });
  const [newComment, setNewComment] = useState({ content: '', images: [] });
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const { userId } = useParams();
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editImages, setEditImages] = useState([]);
  const [editFileList, setEditFileList] = useState([]);
  const { confirm } = Modal;
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const navigate = useNavigate();

  // Add a ref for the Upload component
  const uploadRef = React.useRef();

  // Function to upload image to Cloudinary
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
      console.log('Uploading to Cloudinary with config:', {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        url: CLOUDINARY_URL
      });

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
      console.log('Cloudinary upload successful:', data);
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Fetch posts from Firebase with user data
  useEffect(() => {
    const postsRef = ref(database, 'posts');
    const unsubscribe = onValue(postsRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.entries(data).map(([id, post]) => ({
          id,
          ...post,
          showComments: false,
          hasLiked: post.likedBy && auth.currentUser ? post.likedBy[auth.currentUser.uid] || false : false
        })).sort((a, b) => b.timestamp - a.timestamp);
        setPosts(postsArray);
      } else {
        setPosts([]);
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

  const handleCreatePost = async () => {
    try {
      setLoading(true);
      if (!auth.currentUser) {
        message.error('Please login to create a post');
        return;
      }

      // Check if user has a name
      if (!userName) {
        message.error('Please set your name in your profile before posting');
        setLoading(false);
        return;
      }

      // Verify Cloudinary configuration before attempting upload
      if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || !import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
        message.error('Image upload is not configured properly. Please contact support.');
        setLoading(false);
        return;
      }

      // Upload images to Cloudinary first
      const imageUrls = [];
      if (newPost.images && newPost.images.length > 0) {
        try {
          console.log('Starting image uploads, total images:', newPost.images.length);
          for (const file of newPost.images) {
            if (file && file.originFileObj) {
              console.log('Uploading file:', file.name, 'Size:', file.originFileObj.size);
              const imageUrl = await uploadImageToCloudinary(file.originFileObj);
              if (imageUrl) {
                console.log('Successfully uploaded image, URL:', imageUrl);
                imageUrls.push(imageUrl);
              }
            }
          }
          console.log('All images uploaded successfully:', imageUrls);
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          message.error('Failed to upload images. Please check your image files and try again.');
          setLoading(false);
          return;
        }
      }

      // Create post data
      const postData = {
        content: newPost.content.trim(),
        timestamp: serverTimestamp(),
        likes: 0,
        comments: {},
        author: {
          uid: auth.currentUser.uid,
          name: userName,
          photoURL: auth.currentUser.photoURL || null,
          role: userRole
        }
      };

      if (imageUrls.length > 0) {
        postData.images = imageUrls;
      }

      // Create the post in the posts collection
      const postsRef = ref(database, 'posts');
      const newPostRef = push(postsRef);
      const postId = newPostRef.key;

      // Add the post reference to the user's posts
      const userPostsRef = ref(database, `users/${auth.currentUser.uid}/posts/${postId}`);
      
      // Use a transaction to update both locations
      try {
        await set(newPostRef, postData);
        await set(userPostsRef, {
          timestamp: serverTimestamp(),
          postId: postId
        });

        console.log('Post created successfully with ID:', postId);
        
        // Clear the form and upload input
        setNewPost({ content: '', images: [] });
        setFileList([]); // Reset the file list
        
        message.success('Post created successfully!');
      } catch (error) {
        console.error('Error in transaction:', error);
        message.error('Failed to create post. Please try again.');
      }

    } catch (error) {
      console.error('Error creating post:', error);
      message.error('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update the Upload component to handle file size and type validation
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

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    setNewPost({ ...newPost, images: newFileList });
  };

  const handleAddComment = async (postId) => {
    try {
      if (!auth.currentUser) {
        message.error('Please login to comment');
        return;
      }

      // Check if user has a name
      if (!userName) {
        message.error('Please set your name in your profile before commenting');
        return;
      }

      if (!newComment.content.trim()) {
        message.error('Please enter a comment');
        return;
      }

      const commentData = {
        content: newComment.content.trim(),
        timestamp: serverTimestamp(),
        author: {
          uid: auth.currentUser.uid,
          name: userName,
          photoURL: auth.currentUser.photoURL || null
        }
      };

      const commentRef = ref(database, `posts/${postId}/comments`);
      const newCommentRef = push(commentRef);
      await set(newCommentRef, commentData);

      // Add comment reference to user's comments
      const userCommentRef = ref(database, `users/${auth.currentUser.uid}/comments/${newCommentRef.key}`);
      await set(userCommentRef, {
        postId: postId,
        commentId: newCommentRef.key,
        timestamp: serverTimestamp()
      });

      setNewComment({ content: '', images: [] });
      message.success('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error('Failed to add comment. Please try again.');
    }
  };

  const handleLike = async (postId) => {
    try {
      if (!auth.currentUser) {
        message.error('Please login to like posts');
        return;
      }

      const userLikesRef = ref(database, `users/${auth.currentUser.uid}/likes/${postId}`);
      const postLikesRef = ref(database, `posts/${postId}/likes`);
      const userHasLikedRef = ref(database, `posts/${postId}/likedBy/${auth.currentUser.uid}`);

      // Check if user has already liked
      const likeSnapshot = await get(userHasLikedRef);
      const hasLiked = likeSnapshot.exists();

      if (hasLiked) {
        // Unlike: Remove like
        await set(userHasLikedRef, null);
        await set(userLikesRef, null);
        
        // Update likes count
        const currentPost = posts.find(p => p.id === postId);
        if (currentPost) {
          await set(postLikesRef, (currentPost.likes || 1) - 1);
        }
      } else {
        // Like: Add like
        await set(userHasLikedRef, true);
        await set(userLikesRef, {
          timestamp: serverTimestamp()
        });
        
        // Update likes count
        const currentPost = posts.find(p => p.id === postId);
        await set(postLikesRef, (currentPost.likes || 0) + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      message.error('Failed to update like. Please try again.');
    }
  };

  const getRoleBadge = (role) => {
    if (!role) return null;
    
    switch(role.toLowerCase()) {
      case 'teacher':
        return (
          <Tag 
            icon={<CrownOutlined />} 
            color="gold"
            className="ml-1 text-xs"
          >
            Teacher
          </Tag>
        );
      case 'student':
        return (
          <Tag 
            icon={<BookOutlined />} 
            color="blue"
            className="ml-1 text-xs"
          >
            Student
          </Tag>
        );
      default:
        return null;
    }
  };

  const handleEditPost = async () => {
    try {
      if (!editingPost || !editContent.trim()) return;
      setLoading(true);

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

      const postRef = ref(database, `posts/${editingPost.id}`);
      await set(postRef, {
        ...editingPost,
        content: editContent.trim(),
        images: imageUrls,
        editedAt: serverTimestamp()
      });

      setEditingPost(null);
      setEditContent('');
      setEditImages([]);
      setEditFileList([]);
      message.success('Post updated successfully!');
    } catch (error) {
      console.error('Error updating post:', error);
      message.error('Failed to update post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEditImage = (indexToRemove) => {
    const updatedImages = editingPost.images.filter((_, index) => index !== indexToRemove);
    setEditingPost({ ...editingPost, images: updatedImages });
  };

  const handleDeletePost = async (postId) => {
    try {
      const postRef = ref(database, `posts/${postId}`);
      const userPostRef = ref(database, `users/${auth.currentUser.uid}/posts/${postId}`);

      await set(postRef, null);
      await set(userPostRef, null);

      message.success('Post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error);
      message.error('Failed to delete post. Please try again.');
    }
  };

  const showDeleteConfirm = (postId) => {
    confirm({
      title: 'Are you sure you want to delete this post?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        handleDeletePost(postId);
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
          setEditContent(post.content);
          setEditImages([]);
          setEditFileList([]);
        }
      },
      {
        key: 'delete',
        label: 'Delete Post',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => showDeleteConfirm(post.id)
      }
    ];
  };

  const handleEditComment = async (postId, commentId) => {
    try {
      if (!editCommentContent.trim()) {
        message.error('Comment cannot be empty');
        return;
      }

      const commentRef = ref(database, `posts/${postId}/comments/${commentId}`);
      const commentSnapshot = await get(commentRef);
      const currentComment = commentSnapshot.val();

      if (!currentComment) {
        message.error('Comment not found');
        return;
      }

      await set(commentRef, {
        ...currentComment,
        content: editCommentContent.trim(),
        editedAt: serverTimestamp()
      });

      setEditingComment(null);
      setEditCommentContent('');
      message.success('Comment updated successfully!');
    } catch (error) {
      console.error('Error updating comment:', error);
      message.error('Failed to update comment. Please try again.');
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
      const path = `/forum/${auth.currentUser.uid}/view/${authorId}`;
      console.log('Navigating to view profile:', path);
      navigate(path);
    }
  };

  return (  
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-3xl">
      {/* Create Post Section */}
      <Card className="mb-4 md:mb-6 shadow-sm rounded-lg">
        <div className="flex items-start gap-2 md:gap-4">
          <Avatar 
            icon={<UserOutlined />} 
            src={auth.currentUser?.photoURL}
            size={{ xs: 32, sm: 40, md: 48 }}
            className="flex-shrink-0 cursor-pointer"
            onClick={() => auth.currentUser && handleProfileClick(auth.currentUser.uid)}
          />
          <div className="flex-grow w-full">
            <textarea
              placeholder="What's your study question or tip?"
              className="w-full px-2 py-1.5 sm:p-3 md:p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base resize-none min-h-[60px] sm:min-h-[80px] md:min-h-[100px]"
              value={newPost.content}
              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
            />
            
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 sm:gap-3">
              <div className="flex-grow">
                <Upload
                  multiple
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  onChange={handleUploadChange}
                  fileList={fileList}
                  maxCount={4}
                  accept="image/*"
                  className="w-full"
                >
                  <Button 
                    icon={<PlusOutlined className="text-xs sm:text-sm" />} 
                    className="flex items-center justify-center w-full xs:w-auto h-7 sm:h-8 md:h-9 text-xs sm:text-sm"
                  >
                    <span className="ml-1">Add Images ({fileList.length}/4)</span>
                  </Button>
                </Upload>
              </div>
              
              <Button 
                type="primary" 
                onClick={handleCreatePost}
                loading={loading}
                disabled={!newPost.content.trim() && newPost.images.length === 0}
                className="w-full xs:w-auto h-7 sm:h-8 md:h-9 text-xs sm:text-sm"
              >
                Post
              </Button>
            </div>

            {newPost.images.length > 0 && (
              <div className="mt-2 sm:mt-3 md:mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
                  {newPost.images.map((file, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={URL.createObjectURL(file.originFileObj)}
                        alt={`Preview ${index}`}
                        className="rounded-lg object-cover aspect-square w-full"
                      />
                      <Button
                        type="text"
                        className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-black/50 hover:bg-black/70 text-white p-0.5 sm:p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newFileList = fileList.filter((_, i) => i !== index);
                          setFileList(newFileList);
                          setNewPost({ ...newPost, images: newFileList });
                        }}
                        icon={<DeleteOutlined className="text-xs sm:text-sm" />}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Edit Post Modal */}
      <Modal
        title="Edit Post"
        open={editingPost !== null}
        onOk={handleEditPost}
        onCancel={() => {
          setEditingPost(null);
          setEditContent('');
          setEditImages([]);
          setEditFileList([]);
        }}
        okText="Save"
        cancelText="Cancel"
        width={600}
      >
        <Input.TextArea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
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

      {/* Posts Feed */}
      {posts.length > 0 ? (
        posts.map(post => (
          <Card
            key={post.id}
            className="mb-3 sm:mb-4 md:mb-6 shadow-sm hover:shadow-md transition-shadow rounded-lg"
          >
            {/* Post Header */}
            <div className="flex items-start justify-between mb-2">
              <Meta
                avatar={
                  <Avatar 
                    icon={<UserOutlined />}
                    src={post.author.photoURL}
                    size={{ xs: 32, sm: 40, md: 48 }}
                    className="flex-shrink-0 border-2 border-white shadow-sm cursor-pointer"
                    onClick={() => handleProfileClick(post.author.uid)}
                  />
                }
                title={
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <span 
                      className="font-medium text-xs sm:text-sm md:text-base cursor-pointer hover:text-blue-500"
                      onClick={() => handleProfileClick(post.author.uid)}
                    >
                      {post.author.name}
                    </span>
                    {getRoleBadge(post.author.role)}
                    <span className="text-gray-500 text-xs sm:text-sm">
                      • {moment(post.timestamp).fromNow()}
                      {post.editedAt && ' (edited)'}
                    </span>
                  </div>
                }
              />
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

            {/* Post Content */}
            <div className="mt-2 sm:mt-3 md:mt-4 pl-0 sm:pl-12 md:pl-14">
              {post.content && (
                <p className="text-gray-800 mb-2 sm:mb-3 md:mb-4 leading-relaxed text-xs sm:text-sm md:text-base">
                  {post.content}
                </p>
              )}
              {/* Display uploaded images */}
              {post.images && post.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  {post.images.map((imageUrl, index) => (
                    <Image
                      key={index}
                      src={imageUrl}
                      alt={`Post image ${index + 1}`}
                      className="rounded-lg object-cover aspect-square w-full"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Engagement Bar */}
            <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 pl-0 sm:pl-12 md:pl-14">
              <Tooltip title={post.hasLiked ? "Unlike" : "Like"}>
                <Button 
                  type="text" 
                  icon={post.hasLiked ? 
                    <LikeFilled style={{ color: '#1890ff' }} className="text-xs sm:text-sm" /> : 
                    <LikeOutlined className="text-xs sm:text-sm" />
                  }
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center h-7 sm:h-8 md:h-9 text-xs sm:text-sm hover:text-blue-500 ${
                    post.hasLiked ? 'text-[#1890ff] hover:text-[#1890ff]' : ''
                  }`}
                >
                  <span className={`ml-1 ${post.hasLiked ? 'text-[#1890ff]' : ''}`}>
                    {post.likes || 0}
                  </span>
                </Button>
              </Tooltip>
              <Button 
                type="text" 
                icon={<MessageOutlined className="text-xs sm:text-sm" />}
                onClick={() => setPosts(posts.map(p => 
                  p.id === post.id ? {...p, showComments: !p.showComments} : p
                ))}
                className="flex items-center h-7 sm:h-8 md:h-9 text-xs sm:text-sm"
              >
                <span className="ml-1">{post.comments ? Object.keys(post.comments).length : 0} Comments</span>
              </Button>
            </div>

            {/* Comments Section */}
            {post.showComments && (
              <div className="mt-3 md:mt-4 pl-0 sm:pl-2 md:pl-4 border-l-2 border-gray-100">
                {/* Existing Comments */}
                {post.comments && Object.entries(post.comments).map(([commentId, comment]) => (
                  <div key={commentId} className="flex items-start gap-1.5 sm:gap-2 my-2 sm:my-3 pr-1 sm:pr-2">
                    <Avatar
                      icon={<UserOutlined />}
                      src={comment.author.photoURL}
                      size={{ xs: 24, sm: 28, md: 32 }}
                      className="flex-shrink-0 cursor-pointer"
                      onClick={() => handleProfileClick(comment.author.uid)}
                    />
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span 
                            className="font-medium text-xs sm:text-sm truncate cursor-pointer hover:text-blue-500"
                            onClick={() => handleProfileClick(comment.author.uid)}
                          >
                            {comment.author.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            • {moment(comment.timestamp).fromNow()}
                            {comment.editedAt && ' (edited)'}
                          </span>
                        </div>
                        {auth.currentUser && comment.author.uid === auth.currentUser.uid && (
                          <div className="flex items-center">
                            <Button
                              type="text"
                              icon={<EditOutlined className="text-xs sm:text-sm" />}
                              onClick={() => {
                                setEditingComment({ postId: post.id, commentId, content: comment.content });
                                setEditCommentContent(comment.content);
                              }}
                              className="text-gray-500 hover:text-blue-500 px-1 h-6"
                            />
                          </div>
                        )}
                      </div>
                      
                      {editingComment?.postId === post.id && editingComment?.commentId === commentId ? (
                        <div className="mt-1">
                          <Input.TextArea
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            className="text-xs sm:text-sm mb-2"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="small"
                              onClick={() => {
                                setEditingComment(null);
                                setEditCommentContent('');
                              }}
                              className="text-xs h-6"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => handleEditComment(post.id, commentId)}
                              className="text-xs h-6"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 text-xs sm:text-sm mt-0.5 sm:mt-1 break-words">
                          {comment.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* New Comment Input */}
                <div className="flex items-start gap-1.5 sm:gap-2 mt-2 sm:mt-3 pr-1 sm:pr-2">
                  <Avatar 
                    icon={<UserOutlined />}
                    src={auth.currentUser?.photoURL}
                    size={{ xs: 24, sm: 28, md: 32 }}
                    className="flex-shrink-0"
                  />
                  <div className="flex-grow min-w-0">
                    <textarea
                      placeholder="Write a comment..."
                      className="w-full px-2 py-1.5 sm:p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm mb-2 resize-none min-h-[40px] sm:min-h-[50px]"
                      value={newComment.content}
                      onChange={(e) => setNewComment({...newComment, content: e.target.value})}
                    />
                    
                    <div className="flex items-center justify-end">
                      <Button 
                        type="primary"
                        onClick={() => handleAddComment(post.id)}
                        disabled={!newComment.content.trim()}
                        className="h-7 sm:h-8 text-xs sm:text-sm px-3 sm:px-4"
                      >
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))
      ) : (
        <div className="text-center py-6 sm:py-8">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="space-y-2">
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">No posts yet</p>
                <p className="text-gray-400 text-xs sm:text-sm">Be the first one to share your thoughts!</p>
              </div>
            }
          >
            <Button 
              type="primary" 
              icon={<PlusOutlined className="text-xs sm:text-sm" />}
              className="mt-4 h-8 sm:h-9 text-xs sm:text-sm"
              onClick={() => {
                const textarea = document.querySelector('textarea');
                if (textarea) {
                  textarea.focus();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              Create Post
            </Button>
          </Empty>
        </div>
      )}
    </div>
  );
};

export default Forum;