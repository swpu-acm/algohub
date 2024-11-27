import { AxiosError } from "axios";
import axios from "@/scripts/axios";
import { handleAxiosError } from "@/scripts/utils";
import type { ProblemDetail, Profile } from "./types";

export interface Response<D> {
  success: boolean;
  message: string;
  data?: D;
}

export type ErrorResponse = Response<undefined>;

interface Register {
  username: string;
  email: string;
  password: string;
}

interface AuthResponse {
  id: string;
  token: string;
}

export const register = async (form: Register) => {
  try {
    const response = await axios.post("/account/create", {
      username: form.username,
      email: form.email,
      password: form.password,
    });
    return response.data as Response<AuthResponse>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

interface Upload {
  id: string;
  token: string;
  file: File;
}

interface UploadResponse {
  uri: string;
  path: string;
}

export const uploadContent = async (form: Upload) => {
  try {
    const response = await axios.put("/account/content/upload", form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data as Response<UploadResponse>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

interface ProfileForm {
  id: string;
  token: string;
  profile: Profile;
}

export const updateProfile = async (form: ProfileForm) => {
  try {
    const response = await axios.post("/account/profile", form);
    return response.data as Response<undefined>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

interface LoginForm {
  identity: string;
  password: string;
}

export const login = async (form: LoginForm) => {
  try {
    const response = await axios.post("/account/login", form);
    return response.data as Response<AuthResponse>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

export const fetchProfile = async (id: string) => {
  try {
    const response = await axios.get(`/account/profile/${id}`);
    return response.data as Response<Profile>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

interface ProblemForm {
  id: string;
  token: string;

  title: string;
  description: string;
  input?: string;
  output?: string;
  samples: { input: string; output: string }[];
  hint?: string;
  time_limit: number;
  memory_limit: number;
  test_cases: { input: string; output: string }[];
  categories: string[];
  tags: string[];
  mode: "ICPC" | "OI";
  private: boolean;
}

interface ProblemResponse {
  id: string;
}

export const createProblem = async (form: ProblemForm) => {
  try {
    const response = await axios.post("/problem/create", form);
    return response.data as Response<ProblemResponse>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

export const fetchProblem = async (id: string, form?: AuthResponse) => {
  try {
    const response = await axios.post(`/problem/get/${id}`, form);
    return response.data as Response<ProblemDetail>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

interface SubmitCodeForm {
  id: string;
  token: string;
  language: string;
  code: string;
}

export const submitCode = async (problem_id: string, form: SubmitCodeForm) => {
  try {
    const response = await axios.post(`/problem/submit/${problem_id}`, form);
    return response.data as Response<undefined>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};
