import type { Component } from 'vue';
import {
  CollectionTag,
  DataBoard,
  DocumentChecked,
  Files,
  Histogram,
  Management,
  Notebook,
  OfficeBuilding,
  Reading,
  School,
  User,
} from '@element-plus/icons-vue';

export interface RoleOption {
  label: string;
  value: string;
}

export interface NavigationItem {
  path: string;
  label: string;
  icon: Component;
}

export const roleOptions: RoleOption[] = [
  { label: '教师端', value: 'teacher' },
  { label: '学生端', value: 'student' },
  { label: '管理员端', value: 'admin' },
];

export const navigationByRole: Record<string, NavigationItem[]> = {
  teacher: [
    { path: '/teacher/classes', label: '班级管理', icon: School },
    { path: '/teacher/assignments', label: '创建作业', icon: Reading },
    { path: '/teacher/reviews', label: '提交批改', icon: DocumentChecked },
    { path: '/teacher/plagiarism', label: '查重中心', icon: Histogram },
    { path: '/teacher/profile', label: '个人中心', icon: User },
  ],
  student: [
    { path: '/student/classes', label: '我的班级', icon: School },
    { path: '/student/workspace', label: '作业提交', icon: Notebook },
    { path: '/student/grades', label: '成绩查看', icon: Reading },
    { path: '/student/profile', label: '个人资料', icon: User },
  ],
  admin: [
    { path: '/admin/dashboard', label: '系统概览', icon: DataBoard },
    { path: '/admin/users', label: '用户管理', icon: Management },
    { path: '/admin/majors', label: '专业管理', icon: CollectionTag },
    { path: '/admin/departments', label: '院系管理', icon: OfficeBuilding },
    { path: '/admin/dictionary', label: '字典管理', icon: Files },
  ],
};

export const homeRouteByRole: Record<string, string> = {
  teacher: '/teacher/classes',
  student: '/student/classes',
  admin: '/admin/dashboard',
};
