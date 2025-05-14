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
    <Card className="text-center h-full shadow-sm hover:shadow-md transition-shadow">
      <div className={`text-xl md:text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-gray-500 text-sm md:text-base">{title}</div>
    </Card>
  );

  const renderForumPosts = () => (
    <List
      itemLayout="vertical"
      dataSource={forumPosts}
      locale={{ emptyText: 'No forum posts yet' }}
      className="mt-4"
      renderItem={post => (
        <List.Item className="border-b last:border-b-0">
          <div className="space-y-4">
            <div className="text-lg md:text-xl font-medium">{post.title}</div>
            <div className="text-gray-600 whitespace-pre-wrap">{post.content}</div>
            {post.images && post.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {post.images.map((image, index) => (
                  <div key={index} className="aspect-w-16 aspect-h-9">
                    <Image
                      src={image}
                      alt={`Post image ${index + 1}`}
                      className="rounded-lg object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="text-gray-400 text-sm flex items-center gap-2">
              <span>{moment(post.timestamp).fromNow()}</span>
              {post.edited && <span>(edited)</span>}
            </div>
          </div>
        </List.Item>
      )}
    />
  );

  const renderStudyResources = () => (
    <List
      itemLayout="vertical"
      dataSource={studyResources}
      locale={{ emptyText: 'No study resources yet' }}
      className="mt-4"
      renderItem={resource => (
        <List.Item className="border-b last:border-b-0">
          <div className="space-y-4">
            <div className="text-lg md:text-xl font-medium">{resource.title}</div>
            <div className="text-gray-600 whitespace-pre-wrap">{resource.content}</div>
            {resource.link && (
              <div>
                <a
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-500 hover:text-blue-600 hover:underline"
                >
                  <LinkOutlined className="mr-2" />
                  Resource Link
                </a>
              </div>
            )}
            {resource.attachments && resource.attachments.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {resource.attachments.map((file, index) => (
                  <a
                    key={index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 bg-gray-50 rounded-lg text-blue-500 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                  >
                    {file.type === 'pdf' ? (
                      <FilePdfOutlined className="mr-2" />
                    ) : (
                      <FileImageOutlined className="mr-2" />
                    )}
                    <span className="truncate max-w-[200px]">
                      {file.name || `File ${index + 1}`}
                    </span>
                  </a>
                ))}
              </div>
            )}
            <div className="text-gray-400 text-sm flex items-center gap-2">
              <span>{moment(resource.timestamp).fromNow()}</span>
              {resource.edited && <span>(edited)</span>}
            </div>
          </div>
        </List.Item>
      )}
    />
  );

  const tabItems = [
    {
      key: '1',
      label: (
        <span className="flex items-center">
          <MessageOutlined className="mr-2" />
          Forum Posts
        </span>
      ),
      children: renderForumPosts()
    },
    {
      key: '2',
      label: (
        <span className="flex items-center">
          <BookOutlined className="mr-2" />
          Study Resources
        </span>
      ),
      children: renderStudyResources()
    }
  ];

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Skeleton active avatar paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Empty description="User not found" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Profile Header */}
      <Card className="mb-6 shadow-sm">
        <div className="flex flex-col items-center lg:flex-row lg:items-start gap-6">
          <div className="flex-shrink-0">
            <Avatar
              size={{ xs: 96, sm: 128, md: 144, lg: 160 }}
              icon={<UserOutlined />}
              src={user.profilePicture}
              className="shadow-md"
            />
          </div>
          <div className="flex-grow text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start flex-wrap gap-2">
              <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
              {getRoleBadge(user.role)}
            </div>
            <div className="space-y-2 mt-3">
              <p className="text-gray-500 flex items-center justify-center lg:justify-start">
                <MailOutlined className="mr-2" />
                <span className="break-all">{user.email}</span>
              </p>
              {user.school && (
                <p className="text-gray-500 flex items-center justify-center lg:justify-start">
                  <BookOutlined className="mr-2" />
                  <span>{user.school}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Forum Posts"
            value={forumPosts.length}
            color="text-blue-600"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Study Resources"
            value={studyResources.length}
            color="text-green-600"
          />
        </Col>
        <Col xs={24} lg={8}>
          <StatCard
            title="Member Since"
            value={moment(user.createdAt).format('MMMM YYYY')}
            color="text-purple-600"
          />
        </Col>
      </Row>

      {/* Content Tabs */}
      <Card className="shadow-sm">
        <Tabs 
          defaultActiveKey="1" 
          className="min-h-[300px]"
          items={tabItems}
        />
      </Card>
    </div>
  );
};

export default ViewProfile; 