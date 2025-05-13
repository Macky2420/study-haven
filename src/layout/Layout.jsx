import React, { useState } from 'react';
import { Outlet, Link, useLocation, useParams } from 'react-router-dom';
import { Layout, Menu, Avatar, Drawer, Button } from 'antd';
import { 
  MessageOutlined, 
  BookOutlined, 
  UserOutlined,
  MenuOutlined,
  HomeOutlined
} from '@ant-design/icons';

const { Header, Footer, Content } = Layout;

const AppLayout = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const {userId} = useParams();

  const navItems = [
    { key: 'forum', icon: <MessageOutlined />, label: <Link to={`/forum/${userId}`} onClick={() => setOpen(false)}>Forum</Link> },
    { key: 'study-tools', icon: <BookOutlined />, label: <Link to={`/study-tools/${userId}`} onClick={() => setOpen(false)}>Study Tools</Link> },
    { key: 'profile', icon: <UserOutlined />, label: <Link to={`/profile/${userId}`} onClick={() => setOpen(false)}>Profile</Link> },
  ];

  return (
    <Layout className="min-h-screen flex flex-col">
      {/* Fixed Header */}
      <Header className="h-16 bg-white shadow-sm fixed w-full z-50 px-4">
        <div className="container mx-auto h-full flex items-center justify-between">
          
          {/* Left Section - Brand */}
          <div className="lg:w-1/4">
            <Link to="/">
              <span className="text-xl lg:text-2xl font-bold text-blue-600">Study Haven</span>
            </Link>
          </div>

          {/* Center Section - Desktop Navigation */}
          <div className="hidden lg:block flex-1">
            <Menu
              mode="horizontal"
              items={navItems}
              className="border-0 text-gray-700 justify-center"
              style={{ lineHeight: '64px', borderBottom: 'none' }}
            />
          </div>

          {/* Right Section - Avatar (Desktop) / Hamburger (Mobile) */}
          <div className="flex items-center gap-4 lg:w-1/4 justify-end">
            {/* Mobile Menu Button */}
            <Button
              type="text"
              style={{ color: 'white' }}
              icon={<MenuOutlined className="text-2xl" />}
              onClick={() => setOpen(true)}
              className="flex lg:!hidden bg-transparent hover:bg-blue-600/10 !text-white"
            />
            
            {/* Desktop Profile */}
            <Avatar 
              size={40} 
              icon={<UserOutlined className="text-gray-700" />} 
              src="https://randomuser.me/api/portraits/men/1.jpg" 
              className="!hidden lg:!flex cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200"
            />
          </div>
        </div>
      </Header>

      {/* Mobile Navigation Drawer - Light Theme */}
      <Drawer
        title={<span className="text-gray-800 font-semibold">Main Menu</span>}
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        styles={{ 
          body: { 
            padding: 0,
            backgroundColor: '#f8fafc'
          },
          header: {
            borderBottom: '1px solid #e2e8f0'
          }
        }}
      >
        {/* Mobile Profile Section */}
        <div className="px-4 py-4 border-b border-gray-200 flex items-center gap-3">
          <Avatar 
            size={45} 
            icon={<UserOutlined className="text-gray-700" />} 
            src="https://randomuser.me/api/portraits/men/1.jpg" 
            className="cursor-pointer border-2 border-gray-200"
          />
          <div>
            <div className="font-medium text-gray-800">John Doe</div>
            <div className="text-sm text-gray-500">Student</div>
          </div>
        </div>

        <Menu 
          mode="inline" 
          items={navItems} 
          style={{ 
            borderRight: 0, 
            padding: '8px 0',
            backgroundColor: 'transparent'
          }}
          className="[&_.ant-menu-item]:h-12 [&_.ant-menu-item]:flex [&_.ant-menu-item]:items-center [&_.ant-menu-item]:text-gray-700 hover:[&_.ant-menu-item]:bg-blue-50 [&_.ant-menu-item-selected]:bg-blue-100 [&_.ant-menu-item-selected]:text-blue-600"
        />
      </Drawer>

      {/* Main Content Area */}
      <Content className="flex-grow pt-20 lg:pt-16 container mx-auto px-4 py-6">
        {/* Page Content */}
        <Outlet />
      </Content>

      {/* Footer */}
      <Footer className="bg-gray-100 py-4 mt-auto">
        <div className="text-center text-gray-600 text-sm">
          © {new Date().getFullYear()} Study Haven. All rights reserved.
        </div>
      </Footer>
    </Layout>
  );
};

export default AppLayout;