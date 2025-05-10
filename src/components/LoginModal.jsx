import React from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

const LoginModal = ({ open, onClose, onSwitchToRegister }) => {
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    try {
      // Add your Firebase login logic here
      console.log('Login values:', values);
      message.success('Login successful!');
      onClose();
    } catch (error) {
      message.error(`Login failed: ${error.message}`);
    }
  };

  return (
    <Modal
      title="Welcome Back to Study Haven"
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      className="rounded-lg"
    >
      <Form
        form={form}
        name="login"
        onFinish={handleLogin}
        className="mt-6"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Invalid email format!' }
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400" />}
            placeholder="Email"
            className="hover:border-blue-500 focus:border-blue-500"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 6, message: 'Password must be at least 6 characters!' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Password"
            className="hover:border-blue-500 focus:border-blue-500"
          />
        </Form.Item>

        <div className="text-right mb-4">
          <button
            onClick={() => console.log('Implement forgot password')}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Forgot Password?
          </button>
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            className="h-10 font-semibold hover:scale-[1.01] transition-transform"
          >
            Sign In
          </Button>
        </Form.Item>

        <div className="text-center text-gray-600 mt-4">
          Don't have an account?{' '}
          <button
            onClick={() => {
              onClose();
              onSwitchToRegister();
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create account
          </button>
        </div>
      </Form>
    </Modal>
  );
};

export default LoginModal;