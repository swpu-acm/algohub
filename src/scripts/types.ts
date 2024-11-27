export interface Thing {
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
}

export interface ProblemDetail {
  id: Thing;
  title: string;
  description: string;
  input?: string;
  output?: string;
  samples: Sample[];
  hint?: string;
  time_limit: number;
  memory_limit: number;
  test_cases: Sample[];
  creator: Thing;
  owner: Thing;
  categories: string[];
  tags: string[];
  mode: Mode;
  private: boolean;
  created_at: Date;
  updated_at: Date;
}
