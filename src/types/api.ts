// ==================== 通用响应类型 ====================

export interface PageResult<T> {
  total: number;
  records: T[];
}

// ==================== 认证相关类型 ====================

export interface UsersLoginDTO {
  userNumber: string;
  password: string;
}

export interface UsersLoginVO {
  username: string;
  userNumber: string;
  token: string;
}

// ==================== 用户相关类型 ====================

export interface StudentVO {
  username: string;
  email: string;
  realName: string;
  userNumber: string;
  classCode?: string;
}

export interface TeacherVO {
  username: string;
  email: string;
  realName: string;
  userNumber: string;
  majorCode?: string;
}

export interface UsersDTO {
  username: string;
  email: string;
  password: string;
  roleCode: string;
  realName: string;
  userNumber: string;
  majorCode?: string;
  classCode?: string;
}

export interface UsersUpdateDTO {
  username?: string;
  email?: string;
  realName?: string;
  userNumber: string;
  majorCode?: string;
  classCode?: string;
}

export interface UsersPageQueryDTO {
  username?: string;
  realName?: string;
  userNumber?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface UsersPageQueryVO {
  username: string;
  email: string;
  realName: string;
  userNumber: string;
  majorName?: string;
  className?: string;
}

// ==================== 班级相关类型 ====================

export interface ClassesPageQueryVO {
  className: string;
  classCode: string;
  teacherNumber: string;
}

export interface ClassesVO {
  className: string;
  classCode: string;
  description?: string;
  teacherNumber: string;
}

export interface ClassesPageQueryDTO {
  className?: string;
  classCode?: string;
  teacherNumber?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface ClassesDTO {
  className: string;
  classCode: string;
  description?: string;
}

export interface ClassesUpdateDTO {
  className?: string;
  classCode: string;
  description?: string;
}

// ==================== 作业相关类型 ====================

export interface AssignmentVO {
  id: number;
  title: string;
  totalScore: number;
  classCode: string;
  startTime: string;
  deadline: string;
  assignmentStatusValue: string;
}

export interface AssignmentsDTO {
  title: string;
  totalScore: number;
  classCode: string;
  startTime: string;
  deadline: string;
}

export interface AssignmentsUpdateDTO {
  id: number;
  title?: string;
  totalScore?: number;
  classCode?: string;
  startTime?: string;
  deadline?: string;
  assignmentStatusCode?: string;
}

// ==================== 题目相关类型 ====================

export interface QuestionsBriefVO {
  id: number;
  title: string;
  questionOrder: number;
  maxScore: number;
}

export interface QuestionsVO {
  id: number;
  title: string;
  questionOrder?: number;
  content: string;
  initialCode: string;
  maxScore: number;
}

export interface QuestionsDTO {
  assignmentId: number;
  questionOrder: number;
  title: string;
  content: string;
  initialCode: string;
  maxScore: number;
}

export interface QuestionsUpdateDTO {
  id: number;
  questionOrder?: number;
  title?: string;
  content?: string;
  initialCode?: string;
  maxScore?: number;
}

// ==================== 测试用例相关类型 ====================

export interface TestCasesVO {
  id: number;
  questionId: number;
  caseOrder: number;
  inputData: string[];
  expectedOutput: string;
}

export interface TestCasesDTO {
  questionId: number;
  caseOrder: number;
  inputData: string[];
  expectedOutput: string;
  hidden?: boolean;
}

export interface TestCasesUpdateDTO {
  id: number;
  questionId?: number;
  submissionId?: number;
  caseOrder?: number;
  inputData?: string[];
  expectedOutput?: string;
  hidden?: boolean;
}

// ==================== 提交相关类型 ====================

export interface SubmissionsVO {
  title: string;
  totalScore: number;
  submittedAt: string;
  gradingCompletedAt: string;
  submissionStatusValue: string;
}

export interface QuestionSubmissionsVO {
  id: number;
  questionId: number;
  studentNumber: string;
  studentAnswerCode: string;
  score: number;
  gradedByName: string;
  gradingCompletedAt: string;
  teacherFeedback?: string;
}

export interface QuestionSubmissionsUpdateDTO {
  id: number;
  score: number;
  teacherFeedback?: string;
}

// ==================== 测试结果相关类型 ====================

export interface TestCaseResultsVO {
  id: number;
  questionSubmissionId: number;
  testCaseId: number;
  submissionId: number;
  actualOutput?: string;
  passed: boolean;
  executionTime: number;
  errorMessage?: string;
}

export interface HiddenTestCaseResultsVO {
  passedCount: number;
  totalCount: number;
}

// ==================== 查重相关类型 ====================

export interface PlagiarismChecksVO {
  id: number;
  assignmentId: number;
  initiatedByNumber: string;
  totalComparisons: number;
  executionTime?: number;
  statusValue: string;
  errorMessage?: string;
  startTime?: string;
  completedAt?: string;
}

export interface PlagiarismComparisonsVO {
  id: number;
  plagiarismCheckId: number;
  firstSubmissionName: string;
  secondSubmissionName: string;
  avgSimilarity: number;
  maxSimilarity: number;
  maximumLength: number;
  longestMatch: number;
}

// ==================== 专业相关类型 ====================

export interface MajorPageQueryVO {
  majorCode: string;
  majorName: string;
  departmentName: string;
}

export interface MajorDTO {
  majorCode: string;
  majorName: string;
  departmentCode: string;
}

export interface MajorUpdateDTO {
  majorCode: string;
  majorName?: string;
  departmentCode?: string;
}

export interface MajorPageQueryDTO {
  majorCode?: string;
  majorName?: string;
  departmentCode?: string;
  pageNum?: number;
  pageSize?: number;
}

// ==================== 院系相关类型 ====================

export interface DepartmentPageQueryVO {
  departmentCode: string;
  departmentName: string;
}

export interface DepartmentDTO {
  departmentCode: string;
  departmentName: string;
}

export interface DepartmentUpdateDTO {
  departmentCode: string;
  departmentName?: string;
}

export interface DepartmentPageQueryDTO {
  departmentCode?: string;
  departmentName?: string;
  pageNum?: number;
  pageSize?: number;
}

// ==================== 字典相关类型 ====================

export interface DictTypePageQueryVO {
  id: number;
  typeCode: string;
  typeName: string;
  description: string;
  system: boolean;
}

export interface DictTypeDTO {
  typeCode: string;
  typeName: string;
  description: string;
  system: boolean;
}

export interface DictTypeUpdateDTO {
  id: number;
  typeCode?: string;
  typeName?: string;
  description?: string;
  system?: boolean;
}

export interface DictTypePageQueryDTO {
  typeCode?: string;
  typeName?: string;
  system?: boolean;
  pageNum?: number;
  pageSize?: number;
}

export interface DictDataPageQueryVO {
  id: number;
  typeCode: string;
  dataCode: string;
  dataValue: string;
  sortOrder: number;
  description: string;
  active: boolean;
}

export interface DictDataDTO {
  typeCode: string;
  dataCode: string;
  dataValue: string;
  sortOrder: number;
  description: string;
  active: boolean;
}

export interface DictDataUpdateDTO {
  id: number;
  typeCode?: string;
  dataCode?: string;
  dataValue?: string;
  sortOrder?: number;
  description?: string;
  active?: boolean;
}

export interface DictDataPageQueryDTO {
  typeCode?: string;
  dataCode?: string;
  dataValue?: string;
  active?: boolean;
  pageNum?: number;
  pageSize?: number;
}
