import { http } from './http';
import { buildQueryString } from '../utils/helpers';
import type {
  UsersLoginDTO,
  UsersLoginVO,
  UsersDTO,
  UsersUpdateDTO,
  UsersPageQueryDTO,
  UsersPageQueryVO,
  PageResult,
  ClassesVO,
  ClassesDTO,
  ClassesUpdateDTO,
  StudentVO,
  AssignmentVO,
  AssignmentsDTO,
  AssignmentsUpdateDTO,
  QuestionsBriefVO,
  QuestionsVO,
  QuestionsDTO,
  QuestionsUpdateDTO,
  TestCasesVO,
  TestCasesDTO,
  TestCasesUpdateDTO,
  SubmissionsVO,
  QuestionSubmissionsVO,
  QuestionSubmissionsUpdateDTO,
  TestCaseResultsVO,
  HiddenTestCaseResultsVO,
  PlagiarismChecksVO,
  PlagiarismComparisonsVO,
  MajorDTO,
  MajorUpdateDTO,
  MajorPageQueryDTO,
  DepartmentDTO,
  DepartmentUpdateDTO,
  DepartmentPageQueryDTO,
  DictTypePageQueryVO,
  DictTypeDTO,
  DictTypeUpdateDTO,
  DictTypePageQueryDTO,
  DictDataPageQueryVO,
  DictDataDTO,
  DictDataUpdateDTO,
  DictDataPageQueryDTO,
  ClassesPageQueryDTO,
  TeacherVO,
  ClassesPageQueryVO,
  MajorPageQueryVO,
  DepartmentPageQueryVO,
} from '../types/api';

// 认证相关 API
export const authApi = {
  login: (role: string, payload: UsersLoginDTO) =>
    http.postPublic<UsersLoginVO>(`/${role}/users/userslogin`, payload),
};

// 教师相关 API
export const teacherApi = {
  getProfile: () => http.get<TeacherVO>('/teacher/users/teacherQueryById'),
  getClasses: () =>
    http.get<ClassesVO[]>('/teacher/classes/teacherQueryClassesById'),
  createClass: (payload: ClassesDTO) =>
    http.post<string>('/teacher/classes/addClasses', payload),
  updateClass: (payload: ClassesUpdateDTO) =>
    http.put<string>('/teacher/classes/updateClasses', payload),
  deleteClass: (classCode: string) =>
    http.delete<string>(`/teacher/classes/deleteClasses/${classCode}`),
  getStudentsByClass: (classCode: string) =>
    http.get<StudentVO[]>(`/teacher/classes/queryStudentById/${classCode}`),
  removeStudent: (studentNumber: string) =>
    http.delete<string>(`/teacher/classes/removeStudent/${studentNumber}`),
  getAssignmentsByClass: (classCode: string) =>
    http.get<AssignmentVO[]>(
      `/teacher/assignments/teacherQueryById/${classCode}`,
    ),
  createAssignment: (payload: AssignmentsDTO) =>
    http.post<string>('/teacher/assignments/addAssignments', payload),
  updateAssignment: (payload: AssignmentsUpdateDTO) =>
    http.put<string>('/teacher/assignments/updateAssignments', payload),
  deleteAssignment: (id: number) =>
    http.delete<string>(`/teacher/assignments/deleteAssignments/${id}`),
  getQuestionsByAssignment: (assignmentId: number) =>
    http.get<QuestionsBriefVO[]>(
      `/teacher/questions/getQuestions/${assignmentId}`,
    ),
  getQuestionById: (id: number) =>
    http.get<QuestionsVO>(`/teacher/questions/getQuestionsById/${id}`),
  createQuestion: (payload: QuestionsDTO) =>
    http.post<string>('/teacher/questions/addQuestions', payload),
  updateQuestion: (payload: QuestionsUpdateDTO) =>
    http.put<string>('/teacher/questions/updateQuestions', payload),
  deleteQuestion: (id: number) =>
    http.delete<string>(`/teacher/questions/deleteQuestions/${id}`),
  getTestCasesByQuestion: (id: number) =>
    http.get<TestCasesVO[]>(`/teacher/testCases/getTestCases/${id}`),
  createTestCase: (payload: TestCasesDTO) =>
    http.post<string>('/teacher/testCases/addTestCases', payload),
  updateTestCase: (payload: TestCasesUpdateDTO) =>
    http.put<string>('/teacher/testCases/updateTestCases', payload),
  deleteTestCase: (id: number) =>
    http.delete<string>(`/teacher/testCases/deleteTestCases/${id}`),
  getAssignmentSubmission: (assignmentId: number, studentNumber: string) =>
    http.get<SubmissionsVO>(
      `/teacher/submissions/queryById/${assignmentId}/${studentNumber}`,
    ),
  getQuestionSubmissionDetail: (questionId: number, studentNumber: string) =>
    http.get<QuestionSubmissionsVO[]>(
      `/teacher/questionSubmissions/teacherQueryById/${questionId}/${studentNumber}`,
    ),
  updateQuestionSubmissionScore: (payload: QuestionSubmissionsUpdateDTO) =>
    http.put<string>('/teacher/questionSubmissions/manualScore', payload),
  getTestCaseResults: (questionSubmissionId: number) =>
    http.get<TestCaseResultsVO[]>(
      `/teacher/testCaseResults/getTestCaseResults/${questionSubmissionId}`,
    ),
  publishPlagiarism: (assignmentId: number) =>
    http.get<string>(`/teacher/plagiarismChecks/publish/${assignmentId}`),
  getPlagiarismChecks: (assignmentId: number) =>
    http.get<PlagiarismChecksVO[]>(
      `/teacher/plagiarismChecks/queryPlagiarismChecks/${assignmentId}`,
    ),
  getPlagiarismComparisons: (plagiarismCheckId: number) =>
    http.get<PlagiarismComparisonsVO[]>(
      `/teacher/PlagiarismComparisons/queryPlagiarismComparisons/${plagiarismCheckId}`,
    ),
  downloadPlagiarismReport: (id: number) =>
    http.download(`/teacher/plagiarismChecks/download/${id}`),
};

// 学生相关 API
export const studentApi = {
  getProfile: () => http.get<StudentVO>('/student/users/studentQueryById'),
  joinClass: (classCode: string) =>
    http.put<string>(`/student/users/joinClass/${classCode}`),
  getClassesPage: (params: ClassesPageQueryDTO) =>
    http.post<PageResult<ClassesPageQueryVO>>('/student/classes/page', params),
  getCurrentClass: () => http.get<ClassesVO>('/student/classes/queryById'),
  getAssignments: () =>
    http.get<AssignmentVO[]>('/student/assignments/queryById'),
  getQuestionsByAssignment: (assignmentId: number) =>
    http.get<QuestionsBriefVO[]>(
      `/student/questions/getQuestions/${assignmentId}`,
    ),
  getQuestionById: (id: number) =>
    http.get<QuestionsVO>(`/student/questions/getQuestionsById/${id}`),
  getVisibleTestCases: (questionId: number) =>
    http.get<TestCasesVO[]>(
      `/student/testCases/getVisibleTestCases/${questionId}`,
    ),
  createSubmission: (assignmentId: number) =>
    http.post<string>(`/student/submissions/addSubmissions/${assignmentId}`),
  getSubmissionDetail: (assignmentId: number) =>
    http.get<SubmissionsVO>(`/student/submissions/queryById/${assignmentId}`),
  uploadQuestionAnswer: (questionId: number, formData: FormData) =>
    http.post<string>(
      `/student/questionSubmissions/upload-with-file${buildQueryString({ questionId })}`,
      formData,
    ),
  getQuestionSubmission: (questionId: number) =>
    http.get<QuestionSubmissionsVO[]>(
      `/student/questionSubmissions/queryById/${questionId}`,
    ),
  getTestCaseResults: (questionSubmissionId: number) =>
    http.get<TestCaseResultsVO[]>(
      `/student/testCaseResults/studentGetTestCaseResults/${questionSubmissionId}`,
    ),
  getHiddenTestCaseResults: (questionSubmissionId: number) =>
    http.get<HiddenTestCaseResultsVO>(
      `/student/testCaseResults/studentGetHiddenTestCaseResults/${questionSubmissionId}`,
    ),
};

// 管理员相关 API
export const adminApi = {
  usersPage: (params: UsersPageQueryDTO) =>
    http.post<PageResult<UsersPageQueryVO>>('/admin/users/page', params),
  createUser: (payload: UsersDTO) =>
    http.post<string>('/admin/users/addUsers', payload),
  updateUser: (payload: UsersUpdateDTO) =>
    http.put<string>('/admin/users/updateUsers', payload),
  deleteUser: (userNumber: string) =>
    http.delete<string>(`/admin/users/deleteUsers/${userNumber}`),
  getMajorsPage: (params: MajorPageQueryDTO) =>
    http.post<PageResult<MajorPageQueryVO>>('/admin/major/page', params),
  createMajor: (payload: MajorDTO) =>
    http.post<string>('/admin/major/addMajor', payload),
  updateMajor: (payload: MajorUpdateDTO) =>
    http.put<string>('/admin/major/updateMajor', payload),
  deleteMajor: (majorCode: string) =>
    http.delete<string>(`/admin/major/deleteMajor/${majorCode}`),
  getDepartmentsPage: (params: DepartmentPageQueryDTO) =>
    http.post<PageResult<DepartmentPageQueryVO>>(
      '/admin/department/page',
      params,
    ),
  createDepartment: (payload: DepartmentDTO) =>
    http.post<string>('/admin/department/addDepartment', payload),
  updateDepartment: (departmentCode: string, payload: DepartmentUpdateDTO) =>
    http.put<string>(
      `/admin/department/updateDepartment/${departmentCode}`,
      payload,
    ),
  deleteDepartment: (departmentCode: string) =>
    http.delete<string>(`/admin/department/deleteDepartment/${departmentCode}`),
  getDictTypesPage: (params: DictTypePageQueryDTO) =>
    http.post<PageResult<DictTypePageQueryVO>>('/admin/dictType/page', params),
  createDictType: (payload: DictTypeDTO) =>
    http.post<string>('/admin/dictType/addDictType', payload),
  updateDictType: (payload: DictTypeUpdateDTO) =>
    http.put<string>('/admin/dictType/updateDictType', payload),
  getDictDataPage: (params: DictDataPageQueryDTO) =>
    http.post<PageResult<DictDataPageQueryVO>>('/admin/dictData/page', params),
  createDictData: (payload: DictDataDTO) =>
    http.post<string>('/admin/dictData/addDictData', payload),
  updateDictData: (payload: DictDataUpdateDTO) =>
    http.put<string>('/admin/dictData/updateDictData', payload),
};
