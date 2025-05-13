import React, { useState, useEffect } from 'react';
import { Card, Avatar, Button, Upload, Image, Tooltip, Badge, message, Empty } from 'antd';
import { 
  LikeOutlined, 
  DislikeOutlined, 
  MessageOutlined, 
  UserOutlined, 
  CrownOutlined,
  PlusOutlined,
  PaperClipOutlined 
} from '@ant-design/icons';
import moment from 'moment';
import { auth, database } from '../database/firebaseConfig';
import { ref, push, set, onValue, serverTimestamp } from 'firebase/database';
import { useParams } from 'react-router-dom';

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
  const { userId } = useParams();

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
        // Convert the object to array and sort by timestamp
        const postsArray = Object.entries(data).map(([id, post]) => ({
          id,
          ...post,
          showComments: false
        })).sort((a, b) => b.timestamp - a.timestamp);
        setPosts(postsArray);
      } else {
        setPosts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch user name from database
  useEffect(() => {
    if (auth.currentUser) {
      const userRef = ref(database, `users/${auth.currentUser.uid}`);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData && userData.name) {
          setUserName(userData.name);
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
        dislikes: 0,
        comments: {},
        author: {
          uid: auth.currentUser.uid,
          name: userName,
          photoURL: auth.currentUser.photoURL || null
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

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-3xl">
      {/* Create Post Section */}
      <Card className="mb-4 md:mb-6 shadow-sm rounded-lg">
        <div className="flex items-start gap-2 md:gap-3">
          <Avatar 
            icon={<UserOutlined />} 
            src={auth.currentUser?.photoURL}
            size={window.innerWidth < 768 ? "default" : "large"}
            className="hidden sm:block"
          />
          <div className="flex-grow">
            <textarea
              placeholder="What's your study question or tip?"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 md:mb-3 text-sm md:text-base"
              rows={2}
              value={newPost.content}
              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
            />
            
            <div className="flex items-center justify-between gap-2">
              <Upload
                multiple
                showUploadList={true}
                beforeUpload={beforeUpload}
                onChange={handleUploadChange}
                fileList={fileList}
                maxCount={4}
                accept="image/*"
              >
                <Button 
                  icon={<PlusOutlined />} 
                  className="flex items-center text-sm md:text-base"
                  size={window.innerWidth < 768 ? "small" : "middle"}
                >
                  Add Images
                </Button>
              </Upload>
              
              <Button 
                type="primary" 
                onClick={handleCreatePost}
                loading={loading}
                disabled={!newPost.content.trim() && newPost.images.length === 0}
                size={window.innerWidth < 768 ? "small" : "middle"}
                className="text-sm md:text-base"
              >
                Post
              </Button>
            </div>

            {newPost.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {newPost.images.map((file, index) => (
                  <Image
                    key={index}
                    src={URL.createObjectURL(file.originFileObj)}
                    alt={`Preview ${index}`}
                    className="rounded-lg object-cover h-20 sm:h-24 w-full"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Posts Feed */}
      {posts.length > 0 ? (
        posts.map(post => (
          <Card
            key={post.id}
            className="mb-4 md:mb-6 shadow-sm hover:shadow-md transition-shadow rounded-lg"
          >
            {/* Post Header */}
            <Meta
              avatar={
                <Avatar 
                  icon={<UserOutlined />}
                  size={window.innerWidth < 768 ? "default" : "large"}
                  className="border-2 border-white shadow-sm"
                />
              }
              title={
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <span className="font-medium text-sm sm:text-base">{post.author.name}</span>
                </div>
              }
              description={
                <span className="text-gray-500 text-xs sm:text-sm">
                  {moment(post.timestamp).fromNow()}
                </span>
              }
            />

            {/* Post Content */}
            <div className="mt-3 md:mt-4 pl-0 sm:pl-14">
              {post.content && (
                <p className="text-gray-800 mb-3 md:mb-4 leading-relaxed text-sm sm:text-base">
                  {post.content}
                </p>
              )}
              {/* Display uploaded images */}
              {post.images && post.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {post.images.map((imageUrl, index) => (
                    <Image
                      key={index}
                      src={imageUrl}
                      alt={`Post image ${index + 1}`}
                      className="rounded-lg object-cover h-40 w-full"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Engagement Bar */}
            <div className="flex items-center gap-2 sm:gap-4 mt-3 md:mt-4 pl-0 sm:pl-14">
              <Tooltip title="Like">
                <Button 
                  type="text" 
                  icon={<LikeOutlined />}
                  size={window.innerWidth < 768 ? "small" : "middle"}
                >
                  {post.likes || 0}
                </Button>
              </Tooltip>
              <Tooltip title="Dislike">
                <Button 
                  type="text" 
                  icon={<DislikeOutlined />}
                  size={window.innerWidth < 768 ? "small" : "middle"}
                >
                  {post.dislikes || 0}
                </Button>
              </Tooltip>
              <Button 
                type="text" 
                icon={<MessageOutlined />}
                size={window.innerWidth < 768 ? "small" : "middle"}
                onClick={() => setPosts(posts.map(p => 
                  p.id === post.id ? {...p, showComments: !p.showComments} : p
                ))}
                className="text-sm sm:text-base"
              >
                {post.comments ? Object.keys(post.comments).length : 0} Comments
              </Button>
            </div>

            {/* Comments Section */}
            {post.showComments && (
              <div className="mt-3 md:mt-4 pl-2 sm:pl-4 border-l-2 border-gray-100">
                {/* Existing Comments */}
                {post.comments && Object.entries(post.comments).map(([commentId, comment]) => (
                  <div key={commentId} className="flex items-start gap-2 sm:gap-3 my-3 sm:my-4">
                    <Avatar
                      icon={<UserOutlined />}
                      size="small"
                    />
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <span className="font-medium text-xs sm:text-sm">{comment.author.name}</span>
                      </div>
                      
                      <p className="text-gray-700 text-xs sm:text-sm mt-1">
                        {comment.content}
                      </p>
                      
                      <span className="text-xs text-gray-500 mt-1 block">
                        {moment(comment.timestamp).fromNow()}
                      </span>
                    </div>
                  </div>
                ))}

                {/* New Comment Input */}
                <div className="flex items-start gap-2 sm:gap-3 mt-3 sm:mt-4">
                  <Avatar 
                    icon={<UserOutlined />} 
                    size="small" 
                  />
                  <div className="flex-grow">
                    <textarea
                      placeholder="Write a comment..."
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm mb-2"
                      rows={1}
                      value={newComment.content}
                      onChange={(e) => setNewComment({...newComment, content: e.target.value})}
                    />
                    
                    <div className="flex items-center justify-between gap-2">
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => handleAddComment(post.id)}
                        disabled={!newComment.content.trim()}
                        className="text-xs sm:text-sm"
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
        <div className="text-center py-8">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="space-y-2">
                <p className="text-gray-600 text-lg">No posts yet</p>
                <p className="text-gray-400 text-sm">Be the first one to share your thoughts!</p>
              </div>
            }
          >
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              className="mt-4"
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