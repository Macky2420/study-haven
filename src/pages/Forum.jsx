import React, { useState } from 'react';
import { Card, Avatar, Button, Upload, Image, Divider, Tooltip, Badge } from 'antd';
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

const { Meta } = Card;

const Forum = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'Maria Garcia',
      role: 'student',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      content: 'Can someone explain this physics problem?',
      images: ['https://picsum.photos/400/300?random=1'],
      timestamp: '2023-05-15T10:30:00',
      likes: 24,
      dislikes: 2,
      comments: [
        {
          author: 'Dr. James Wilson',
          role: 'teacher',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          content: 'Sure! Let me break it down step by step',
          images: [],
          timestamp: '2023-05-15T11:15:00'
        }
      ],
      showComments: false
    },
    {
      id: 2,
      author: 'Alex Chen',
      role: 'student',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      content: '',
      images: ['https://picsum.photos/400/300?random=2'],
      timestamp: '2023-05-14T08:45:00',
      likes: 42,
      dislikes: 1,
      comments: [],
      showComments: false
    }
  ]);

  const [newPost, setNewPost] = useState({ content: '', images: [] });
  const [newComment, setNewComment] = useState({ content: '', images: [] });

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Create Post Section */}
      <Card className="mb-6 shadow-sm rounded-lg">
        <div className="flex items-start gap-3">
          <Avatar 
            icon={<UserOutlined />} 
            src="https://randomuser.me/api/portraits/men/1.jpg"
            size="large"
          />
          <div className="flex-grow">
            <textarea
              placeholder="What's your study question or tip?"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              rows={2}
              value={newPost.content}
              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
            />
            
            <div className="flex items-center justify-between">
              <Upload
                multiple
                showUploadList={false}
                beforeUpload={() => false}
                onChange={({ fileList }) => setNewPost({...newPost, images: fileList})}
              >
                <Button icon={<PlusOutlined />} className="flex items-center">
                  Add Media
                </Button>
              </Upload>
              
              <Button 
                type="primary" 
                disabled={!newPost.content && newPost.images.length === 0}
              >
                Post
              </Button>
            </div>

            {newPost.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {newPost.images.map((file, index) => (
                  <Image
                    key={index}
                    src={URL.createObjectURL(file.originFileObj)}
                    alt={`Preview ${index}`}
                    className="rounded-lg object-cover h-24"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Posts Feed */}
      {posts.map(post => (
        <Card
          key={post.id}
          className="mb-6 shadow-sm hover:shadow-md transition-shadow rounded-lg"
        >
          {/* Post Header */}
          <Meta
            avatar={
              <div className="relative">
                <Avatar 
                  src={post.avatar} 
                  size="large" 
                  className="border-2 border-white shadow-sm"
                />
                {post.role === 'teacher' && (
                  <Badge
                    count={<CrownOutlined className="text-yellow-500" />}
                    offset={[-8, 30]}
                    className="absolute -bottom-1 -right-1"
                  />
                )}
              </div>
            }
            title={
              <div className="flex items-center">
                <span className="font-medium">{post.author}</span>
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  post.role === 'teacher' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {post.role}
                </span>
              </div>
            }
            description={
              <span className="text-gray-500 text-sm">
                {moment(post.timestamp).fromNow()}
              </span>
            }
          />

          {/* Post Content */}
          <div className="mt-4 pl-14">
            {post.content && (
              <p className="text-gray-800 mb-4 leading-relaxed">
                {post.content}
              </p>
            )}
            
            {post.images.length > 0 && (
              <div className={`grid gap-2 ${
                post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}>
                {post.images.map((img, index) => (
                  <Image
                    key={index}
                    src={img}
                    alt={`Post content ${index}`}
                    className="rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Engagement Bar */}
          <div className="flex items-center gap-4 mt-4 pl-14">
            <Tooltip title="Like">
              <Button type="text" icon={<LikeOutlined />} />
            </Tooltip>
            <Tooltip title="Dislike">
              <Button type="text" icon={<DislikeOutlined />} />
            </Tooltip>
            <Button 
              type="text" 
              icon={<MessageOutlined />}
              onClick={() => setPosts(posts.map(p => 
                p.id === post.id ? {...p, showComments: !p.showComments} : p
              ))}
            >
              {post.comments.length} Comments
            </Button>
          </div>

          {/* Comments Section */}
          {post.showComments && (
            <div className="mt-4 pl-4 border-l-2 border-gray-100">
              {/* Existing Comments */}
              {post.comments.map((comment, index) => (
                <div key={index} className="flex items-start gap-3 my-4">
                  <Avatar
                    src={comment.avatar}
                    size="small"
                    icon={!comment.avatar && <UserOutlined />}
                  />
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comment.author}</span>
                      {comment.role === 'teacher' && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Teacher
                        </span>
                      )}
                    </div>
                    
                    {comment.content && (
                      <p className="text-gray-700 text-sm mt-1">
                        {comment.content}
                      </p>
                    )}
                    
                    {comment.images.length > 0 && (
                      <div className="mt-2">
                        <Image
                          src={comment.images[0]}
                          alt="Comment attachment"
                          className="rounded-lg max-w-[200px]"
                        />
                      </div>
                    )}
                    
                    <span className="text-xs text-gray-500 mt-1 block">
                      {moment(comment.timestamp).fromNow()}
                    </span>
                  </div>
                </div>
              ))}

              {/* New Comment Input */}
              <div className="flex items-start gap-3 mt-4">
                <Avatar 
                  icon={<UserOutlined />} 
                  size="small" 
                />
                <div className="flex-grow">
                  <textarea
                    placeholder="Write a comment..."
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2"
                    rows={1}
                    value={newComment.content}
                    onChange={(e) => setNewComment({...newComment, content: e.target.value})}
                  />
                  
                  <div className="flex items-center justify-between">
                    <Upload
                      showUploadList={false}
                      beforeUpload={() => false}
                      onChange={({ fileList }) => setNewComment({...newComment, images: fileList})}
                    >
                      <Button 
                        icon={<PaperClipOutlined />} 
                        size="small" 
                        className="flex items-center"
                      >
                        {newComment.images.length > 0 ? '1 Image' : 'Attach'}
                      </Button>
                    </Upload>
                    
                    <Button 
                      type="primary" 
                      size="small"
                      disabled={!newComment.content && newComment.images.length === 0}
                    >
                      Comment
                    </Button>
                  </div>
                  
                  {newComment.images.length > 0 && (
                    <Image
                      src={URL.createObjectURL(newComment.images[0].originFileObj)}
                      alt="Preview"
                      className="rounded-lg mt-2 max-w-[200px]"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default Forum;