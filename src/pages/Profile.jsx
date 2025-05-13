import React from 'react';
import { 
  Avatar, 
  Card, 
  Tabs, 
  List, 
  Tag, 
  Button, 
  Row, 
  Col 
} from 'antd';
import { 
  MessageOutlined, 
  BookOutlined, 
  UserOutlined, 
  EditOutlined,
  LikeOutlined, 
  CommentOutlined 
} from '@ant-design/icons';

const { TabPane } = Tabs;

const Profile = () => {
  // Sample data
  const user = {
    name: "Sarah Johnson",
    bio: "Computer Science Student | Passionate about AI and Machine Learning",
    avatar: "https://i.pravatar.cc/150?img=3",
    stats: {
      posts: 45,
      likes: 892,
      followers: 234,
      following: 156
    }
  };

  const forumPosts = [
    {
      title: "Best resources for learning React?",
      content: "I'm looking for comprehensive React tutorials...",
      likes: 24,
      comments: 15,
      category: "Programming",
      timestamp: "3 hours ago"
    },
    {
      title: "Discussion about neural networks",
      content: "Let's talk about CNN architectures...",
      likes: 42,
      comments: 28,
      category: "AI",
      timestamp: "1 day ago"
    }
  ];

  const studyTools = [
    {
      title: "Python Cheat Sheet",
      content: "Comprehensive Python 3 reference guide",
      category: "Programming",
      likes: 89,
      timestamp: "2 days ago"
    },
    {
      title: "Calculus Formula Sheet",
      content: "All essential calculus formulas in one place",
      category: "Math",
      likes: 65,
      timestamp: "4 days ago"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* User Profile Section */}
      <Card className="mb-6 shadow-lg">
        <Row gutter={24} align="middle">
          <Col xs={24} md={6} className="text-center mb-4">
            <Avatar 
              size={128} 
              src={user.avatar}
              className="mb-4"
            />
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              className="w-full"
            >
              Edit Profile
            </Button>
          </Col>
          
          <Col xs={24} md={18}>
            <h1 className="text-2xl font-bold mb-2">{user.name}</h1>
            <p className="text-gray-600 mb-4">{user.bio}</p>
            
            <Row gutter={16} className="mb-4">
              <Col>
                <Tag icon={<UserOutlined />} color="blue">
                  {user.stats.followers} Followers
                </Tag>
              </Col>
              <Col>
                <Tag icon={<UserOutlined />} color="geekblue">
                  {user.stats.following} Following
                </Tag>
              </Col>
            </Row>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                title="Posts" 
                value={user.stats.posts} 
                color="#1890ff"
              />
              <StatCard 
                title="Likes" 
                value={user.stats.likes} 
                color="#52c41a"
              />
              <StatCard 
                title="Resources" 
                value={studyTools.length} 
                color="#faad14"
              />
              <StatCard 
                title="Comments" 
                value={234} 
                color="#f5222d"
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* Activity Tabs */}
      <Tabs defaultActiveKey="1" className="shadow-lg">
        <TabPane
          tab={
            <span>
              <MessageOutlined />
              Forum Posts
            </span>
          }
          key="1"
        >
          <List
            itemLayout="vertical"
            dataSource={forumPosts}
            renderItem={post => (
              <List.Item className="!px-0">
                <Card className="w-full hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                      <p className="text-gray-600 mb-2">{post.content}</p>
                      <Tag color="blue">{post.category}</Tag>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{post.timestamp}</div>
                      <div className="flex gap-4 mt-2">
                        <div className="text-gray-500">
                          <LikeOutlined /> {post.likes}
                        </div>
                        <div className="text-gray-500">
                          <CommentOutlined /> {post.comments}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </TabPane>

        <TabPane
          tab={
            <span>
              <BookOutlined />
              Study Tools
            </span>
          }
          key="2"
        >
          <List
            itemLayout="vertical"
            dataSource={studyTools}
            renderItem={tool => (
              <List.Item className="!px-0">
                <Card className="w-full hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
                      <p className="text-gray-600 mb-2">{tool.content}</p>
                      <Tag color="geekblue">{tool.category}</Tag>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{tool.timestamp}</div>
                      <div className="mt-2 text-gray-500">
                        <LikeOutlined /> {tool.likes}
                      </div>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
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