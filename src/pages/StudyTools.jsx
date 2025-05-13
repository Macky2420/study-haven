import React from 'react';
import { 
  Card, 
  List, 
  Avatar, 
  Tag, 
  Button, 
  Upload 
} from 'antd';
import { 
  LinkOutlined, 
  FilePdfOutlined, 
  FileImageOutlined, 
  LikeOutlined, 
  CommentOutlined, 
  ShareAltOutlined 
} from '@ant-design/icons';

const StudyTools = () => {
  // Sample data
  const posts = [
    {
      id: 1,
      author: "Sarah Johnson",
      content: "Found an amazing resource for organic chemistry reactions!",
      link: "https://www.organicchemistrytutor.com",
      likes: 45,
      comments: 12,
      attachments: [
        { type: "image", name: "reaction-chart.jpg" },
        { type: "pdf", name: "practice-questions.pdf" }
      ],
      category: "Chemistry",
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      author: "Mike Chen",
      content: "Comprehensive Python cheat sheet for beginners",
      link: "https://www.pythoncheatsheet.org",
      likes: 89,
      comments: 24,
      attachments: [],
      category: "Programming",
      timestamp: "5 hours ago"
    },
    {
      id: 3,
      author: "Emma Wilson",
      content: "Historical timeline of World War II events",
      attachments: [
        { type: "image", name: "ww2-timeline.png" }
      ],
      category: "History",
      timestamp: "1 day ago"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Sharing Card */}
      <Card 
        title="Share Study Resource"
        className="mb-6 shadow-lg"
        actions={[
          <Button key="link" icon={<LinkOutlined />}>Add Link</Button>,
          <Upload key="upload" showUploadList={false}>
            <Button icon={<FileImageOutlined />}>Add File</Button>
          </Upload>
        ]}
      >
        <div className="mb-4">
          <textarea
            placeholder="Share your study materials, resources, or insights..."
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            rows={3}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <Tag color="blue" className="flex items-center">
            <span className="mr-2">Category:</span>
            <select className="bg-transparent outline-none">
              <option>Chemistry</option>
              <option>Programming</option>
              <option>History</option>
            </select>
          </Tag>
          
          <Button 
            type="primary" 
            className="bg-blue-600 hover:bg-blue-700"
            size="large"
          >
            Post Resource
          </Button>
        </div>
      </Card>

      {/* Resources List */}
      <List
        itemLayout="vertical"
        dataSource={posts}
        renderItem={post => (
          <List.Item className="!px-0">
            <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start mb-4">
                <Avatar 
                  src={`https://i.pravatar.cc/150?img=${post.id}`}
                  size={48}
                  className="mr-4"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold m-0">{post.author}</h3>
                    <Tag color="geekblue">{post.category}</Tag>
                  </div>
                  <p className="text-gray-500 text-sm m-0">{post.timestamp}</p>
                </div>
              </div>

              <p className="text-gray-800 mb-4">{post.content}</p>

              {post.link && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center">
                  <LinkOutlined className="text-blue-600 mr-2" />
                  <a 
                    href={post.link} 
                    className="text-blue-600 hover:underline truncate"
                  >
                    {post.link}
                  </a>
                </div>
              )}

              {post.attachments.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {post.attachments.map((file, index) => (
                    <div 
                      key={index}
                      className="border rounded-lg p-2 flex items-center justify-center bg-gray-50"
                    >
                      {file.type === 'pdf' ? (
                        <FilePdfOutlined className="text-4xl text-red-600" />
                      ) : (
                        <FileImageOutlined className="text-4xl text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 border-t pt-4">
                <Button icon={<LikeOutlined />} className="flex items-center">
                  {post.likes}
                </Button>
                <Button icon={<CommentOutlined />}>
                  {post.comments} Comments
                </Button>
                <Button icon={<ShareAltOutlined />}>Share</Button>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

export default StudyTools;