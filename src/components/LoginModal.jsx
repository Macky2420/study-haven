import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { auth } from '../database/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const LoginModal = ({ open, onClose, onSwitchToRegister }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    try {
      setLoading(true);
      const { email, password } = values;

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      message.success('Login successful!');
      onClose();
      
      // Navigate to home page with user ID
      navigate(`/forum/${user.uid}`);
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        default:
          errorMessage = 'Login failed. Please try again';
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
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
            size="large"
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
            size="large"
            className="hover:border-blue-500 focus:border-blue-500"
          />
        </Form.Item>

        <div className="text-right mb-4">
          <button
            type="button"
            onClick={() => {
              // You can implement password reset functionality here
              message.info('Password reset functionality will be implemented soon');
            }}
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
            loading={loading}
            size="large"
            className="h-10 font-semibold hover:scale-[1.01] transition-transform"
          >
            Sign In
          </Button>
        </Form.Item>

        <div className="text-center text-gray-600 mt-4">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => {
              form.resetFields();
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