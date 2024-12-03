export interface Credentials {
  id: string;
  token: string;
}

export interface RecordId {
  tb: string;
  id: string;
}

export interface Sample {
  input: string;
  output: string;
}

export enum Mode {
  ICPC = "ICPC",
  OI = "OI",
}

export interface Profile {
  username: string;
  email: string;
  avatar?: string;
  signature?: string;
  links?: string[];
  nickname?: string;
  sex?: boolean;
  birthday?: string;
  name?: string;
  student_id?: string;
  school?: string;
  college?: string;
  major?: string;
  rating: number;
}

export interface CreateAsset {
  auth: Credentials;
  owner: string;
  file: File;
}

export interface UserContent {
  id: string;
}

export enum ProblemVisibility {
  ContestOnly = "contest_only",
  Public = "public",
  Private = "private",
  Internal = "internal",
}

export interface TestCase {
  input: string;
  output: string;
}

export interface CreateProblem {
  id: string;
  token: string;

  title: string;
  description: string;
  input?: string;
  output?: string;
  samples: Sample[];
  hint?: string;
  owner: RecordId;
  time_limit: number;
  memory_limit: number;
  test_cases: { input: string; output: string }[];
  categories: string[];
  tags: string[];
  visibility: ProblemVisibility;
}

export interface UserProblem {
  id: string;
  title: string;
  description: string;
  input?: string;
  output?: string;
  samples: Sample[];
  hint?: string;
  time_limit: number;
  memory_limit: number;
  test_cases: TestCase[];
  creator: string;
  owner: RecordId;
  categories: string[];
  tags: string[];
  visibility: ProblemVisibility;
  created_at: string;
  updated_at: string;
}

export enum Language {
  Rust = "rust",
  Python = "python",
  C = "c",
  Cpp = "cpp",
  Golang = "golang",
  Nodejs = "nodejs",
  Java = "java",
}
