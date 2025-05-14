import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Radio, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, BankOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../database/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';

const RegisterModal = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if Firebase Auth is initialized
    if (!auth) {
      console.error('Firebase Auth is not initialized');
      message.error('Authentication service is not available');
    }
  }, []);

  const handleRegister = async (values) => {
    try {
      setLoading(true);

      if (!auth) {
        throw new Error('Authentication service is not available');
      }

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      if (!userCredential || !userCredential.user) {
        throw new Error('Failed to create user account');
      }

      // Save additional user data to Realtime Database
      await set(ref(database, `users/${userCredential.user.uid}`), {
        name: values.name,
        school: values.school,
        role: values.role,
        email: values.email,
        createdAt: new Date().toISOString()
      });

      message.success('Registration successful!');
      form.resetFields();
      onClose();
      
      // Navigate to forum with userId
      const userId = userCredential.user.uid;
      console.log('Navigating to forum with userId:', userId); // Debug log
      navigate(`/forum/${userId}`, { replace: true });
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password must be at least 6 characters';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection';
          break;
        case 'auth/configuration-not-found':
          errorMessage = 'Firebase configuration error. Please try again later';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password sign up is not enabled. Please contact support.';
          break;
        default:
          errorMessage = error.message || 'An unexpected error occurred';
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Join Study Haven"
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      className="rounded-lg"
    >
      <Form
        form={form}
        name="register"
        onFinish={handleRegister}
        scrollToFirstError
        className="mt-6"
      >
        <Form.Item
          name="name"
          rules={[{ required: true, message: 'Please input your name!' }]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="Full Name"
            className="hover:border-blue-500 focus:border-blue-500"
          />
        </Form.Item>

        <Form.Item
          name="school"
          rules={[{ required: true, message: 'Please input your school name!' }]}
        >
          <Input
            prefix={<BankOutlined className="text-gray-400" />}
            placeholder="School Name"
            className="hover:border-blue-500 focus:border-blue-500"
          />
        </Form.Item>

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

        <Form.Item
          name="role"
          rules={[{ required: true, message: 'Please select your role!' }]}
        >
          <Radio.Group>
            <Radio value="student" className="!text-gray-700">Student</Radio>
            <Radio value="teacher" className="!text-gray-700">Teacher</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            className="h-10 font-semibold hover:scale-[1.01] transition-transform"
          >
            Create Account
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RegisterModal;