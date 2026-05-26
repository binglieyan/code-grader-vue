import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { homeRouteByRole } from '../config/navigation';

const LoginView = () => import('../views/LoginView.vue');
const AppLayout = () => import('../views/layouts/AppLayout.vue');
const TeacherClassesView = () =>
  import('../views/teacher/TeacherClassesView.vue');
const TeacherAssignmentsView = () =>
  import('../views/teacher/TeacherAssignmentsView.vue');
const TeacherReviewsView = () =>
  import('../views/teacher/TeacherReviewsView.vue');
const TeacherPlagiarismView = () =>
  import('../views/teacher/TeacherPlagiarismView.vue');
const TeacherProfileView = () =>
  import('../views/teacher/TeacherProfileView.vue');
const StudentClassesView = () =>
  import('../views/student/StudentClassesView.vue');
const StudentWorkspaceView = () =>
  import('../views/student/StudentWorkspaceView.vue');
const StudentGradesView = () =>
  import('../views/student/StudentGradesView.vue');
const StudentProfileView = () =>
  import('../views/student/StudentProfileView.vue');
const AdminDashboardView = () =>
  import('../views/admin/AdminDashboardView.vue');
const AdminUsersView = () => import('../views/admin/AdminUsersView.vue');
const AdminMajorsView = () => import('../views/admin/AdminMajorsView.vue');
const AdminDepartmentsView = () =>
  import('../views/admin/AdminDepartmentsView.vue');
const AdminDictionaryView = () =>
  import('../views/admin/AdminDictionaryView.vue');

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true },
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', redirect: '/login' },
      {
        path: 'teacher/classes',
        component: TeacherClassesView,
        meta: { role: 'teacher' },
      },
      {
        path: 'teacher/assignments',
        component: TeacherAssignmentsView,
        meta: { role: 'teacher' },
      },
      {
        path: 'teacher/reviews',
        component: TeacherReviewsView,
        meta: { role: 'teacher' },
      },
      {
        path: 'teacher/plagiarism',
        component: TeacherPlagiarismView,
        meta: { role: 'teacher' },
      },
      {
        path: 'teacher/profile',
        component: TeacherProfileView,
        meta: { role: 'teacher' },
      },
      { path: 'student/dashboard', redirect: '/student/classes' },
      {
        path: 'student/classes',
        component: StudentClassesView,
        meta: { role: 'student' },
      },
      {
        path: 'student/workspace',
        component: StudentWorkspaceView,
        meta: { role: 'student' },
      },
      {
        path: 'student/grades',
        component: StudentGradesView,
        meta: { role: 'student' },
      },
      {
        path: 'student/profile',
        component: StudentProfileView,
        meta: { role: 'student' },
      },
      {
        path: 'admin/dashboard',
        component: AdminDashboardView,
        meta: { role: 'admin' },
      },
      {
        path: 'admin/users',
        component: AdminUsersView,
        meta: { role: 'admin' },
      },
      {
        path: 'admin/majors',
        component: AdminMajorsView,
        meta: { role: 'admin' },
      },
      {
        path: 'admin/departments',
        component: AdminDepartmentsView,
        meta: { role: 'admin' },
      },
      {
        path: 'admin/dictionary',
        component: AdminDictionaryView,
        meta: { role: 'admin' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();
  if (to.meta.public) {
    return authStore.isAuthenticated ? homeRouteByRole[authStore.role] : true;
  }
  if (!authStore.isAuthenticated) {
    return '/login';
  }
  if (to.meta.role && to.meta.role !== authStore.role) {
    return homeRouteByRole[authStore.role];
  }
  if (to.path === '/teacher/dashboard') {
    return '/teacher/classes';
  }
  return true;
});

export default router;
