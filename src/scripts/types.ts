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

export interface ProblemDetail {
  id: RecordId;
  title: string;
  description: string;
  input?: string;
  output?: string;
  samples: Sample[];
  hint?: string;
  time_limit: number;
  memory_limit: number;
  test_cases: Sample[];
  creator: RecordId;
  owner: RecordId;
  categories: string[];
  tags: string[];
  mode: Mode;
  private: boolean;
  created_at: Date;
  updated_at: Date;
}

export enum Language {
  Rust = "Rust",
  Python = "Python",
  C = "C",
  Cpp = "Cpp",
}
