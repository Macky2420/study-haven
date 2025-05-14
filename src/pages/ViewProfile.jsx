import React, { useState, useEffect } from 'react';
import { 
  Avatar, 
  Card, 
  Tabs, 
  List, 
  Tag, 
  Row, 
  Col,
  Empty,
  Skeleton,
  Image
} from 'antd';
import { 
  MessageOutlined, 
  BookOutlined, 
  UserOutlined,
  LinkOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  CrownOutlined,
  MailOutlined
} from '@ant-design/icons';
import { auth, database } from '../database/firebaseConfig';
import { ref, onValue } from 'firebase/database';
import moment from 'moment';
import { useParams } from 'react-router-dom';

const { TabPane } = Tabs;

const ViewProfile = () => {
  const [user, setUser] = useState(null);
  const [forumPosts, setForumPosts] = useState([]);
  const [studyResources, setStudyResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const { viewId } = useParams();

  // Fetch user data
  useEffect(() => {
    if (!viewId) {
      setLoading(false);
      return;
    }

    const userRef = ref(database, `users/${viewId}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      if (userData) {
        setUser({
          ...userData,
          uid: viewId
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [viewId]);

  // Fetch user's forum posts
  useEffect(() => {
    if (!viewId) return;

    const postsRef = ref(database, 'posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const postsData = snapshot.val();
      if (postsData) {
        const userPosts = Object.entries(postsData)
          .map(([id, post]) => ({ id, ...post }))
          .filter(post => post.author.uid === viewId)
          .sort((a, b) => b.timestamp - a.timestamp);
        setForumPosts(userPosts);
      } else {
        setForumPosts([]);
      }
    });

    return () => unsubscribe();
  }, [viewId]);

  // Fetch user's study resources
  useEffect(() => {
    if (!viewId) return;

    const resourcesRef = ref(database, 'study-resources');
    const unsubscribe = onValue(resourcesRef, (snapshot) => {
      const resourcesData = snapshot.val();
      if (resourcesData) {
        const userResources = Object.entries(resourcesData)
          .map(([id, resource]) => ({ id, ...resource }))
          .filter(resource => resource.author.uid === viewId)
          .sort((a, b) => b.timestamp - a.timestamp);
        setStudyResources(userResources);
      } else {
        setStudyResources([]);
      }
    });

    return () => unsubscribe();
  }, [viewId]);

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

  const StatCard = ({ title, value, color }) => (
    <Card className="text-center h-full">
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-gray-500">{title}</div>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton active avatar paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <Empty description="User not found" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Profile Header */}
      <Card className="mb-6">
        <div className="flex flex-col items-center sm:flex-row sm:items-start">
          <Avatar
            size={128}
            icon={<UserOutlined />}
            src={user.profilePicture}
            className="mb-4 sm:mb-0 sm:mr-6"
          />
          <div className="text-center sm:text-left flex-grow">
            <div className="flex items-center justify-center sm:justify-start">
              <h1 className="text-2xl font-bold mb-2">{user.name}</h1>
              {getRoleBadge(user.role)}
            </div>
            <p className="text-gray-500 mb-2">
              <MailOutlined className="mr-2" />
              {user.email}
            </p>
            {user.school && (
              <p className="text-gray-500">
                <BookOutlined className="mr-2" />
                {user.school}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={8}>
          <StatCard
            title="Forum Posts"
            value={forumPosts.length}
            color="text-blue-600"
          />
        </Col>
        <Col xs={12} sm={8}>
          <StatCard
            title="Study Resources"
            value={studyResources.length}
            color="text-green-600"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Member Since"
            value={moment(user.createdAt).format('MMMM YYYY')}
            color="text-purple-600"
          />
        </Col>
      </Row>

      {/* Content Tabs */}
      <Card>
        <Tabs defaultActiveKey="1">
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
              locale={{ emptyText: 'No forum posts yet' }}
              renderItem={post => (
                <List.Item>
                  <div className="mb-4">
                    <div className="text-lg font-medium mb-2">{post.title}</div>
                    <div className="text-gray-600 mb-2">{post.content}</div>
                    {post.images && post.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {post.images.map((image, index) => (
                          <Image
                            key={index}
                            src={image}
                            alt={`Post image ${index + 1}`}
                            style={{ maxWidth: '150px', height: 'auto' }}
                            className="rounded"
                          />
                        ))}
                      </div>
                    )}
                    <div className="text-gray-400 text-sm">
                      {moment(post.timestamp).fromNow()}
                      {post.edited && <span className="ml-2">(edited)</span>}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <BookOutlined />
                Study Resources
              </span>
            }
            key="2"
          >
            <List
              itemLayout="vertical"
              dataSource={studyResources}
              locale={{ emptyText: 'No study resources yet' }}
              renderItem={resource => (
                <List.Item>
                  <div className="mb-4">
                    <div className="text-lg font-medium mb-2">{resource.title}</div>
                    <div className="text-gray-600 mb-2">{resource.content}</div>
                    {resource.link && (
                      <div className="mb-2">
                        <a
                          href={resource.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <LinkOutlined className="mr-1" />
                          Resource Link
                        </a>
                      </div>
                    )}
                    {resource.attachments && resource.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {resource.attachments.map((file, index) => (
                          <a
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-500 hover:text-blue-600"
                          >
                            {file.type === 'pdf' ? (
                              <FilePdfOutlined className="mr-1" />
                            ) : (
                              <FileImageOutlined className="mr-1" />
                            )}
                            {file.name || `File ${index + 1}`}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="text-gray-400 text-sm">
                      {moment(resource.timestamp).fromNow()}
                      {resource.edited && <span className="ml-2">(edited)</span>}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ViewProfile; 