import React, { useState } from 'react';
import { Modal, Form, Input, Button, Radio, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';

const RegisterModal = ({ open, onClose }) => {
  const [form] = Form.useForm();

  const handleRegister = async (values) => {
    try {
      // Add your Firebase registration logic here
      console.log('Received values:', values);
      message.success('Registration successful!');
      onClose();
    } catch (error) {
      message.error(`Registration failed: ${error.message}`);
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
            className="h-10 font-semibold hover:scale-[1.01] transition-transform"
          >
            Create Account
          </Button>
        </Form.Item>

        <div className="text-center text-gray-600 mt-4">
          Already have an account?{' '}
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Log in here
          </button>
        </div>
      </Form>
    </Modal>
  );
};

export default RegisterModal;