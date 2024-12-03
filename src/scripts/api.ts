import { AxiosError } from "axios";
import axios from "@/scripts/axios";
import { handleAxiosError } from "@/scripts/utils";
import type {
  CreateAsset,
  Credentials,
  UserProblem,
  Profile,
  UserContent,
  CreateProblem,
} from "./types";

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

export const register = async (form: Register) => {
  try {
    const response = await axios.post("/account/create", {
      username: form.username,
      email: form.email,
      password: form.password,
    });
    return response.data as Response<Credentials>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

export const uploadContent = async (form: CreateAsset) => {
  try {
    const response = await axios.put("/asset/upload", form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data as Response<UserContent>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

interface ProfileForm {
  id: string;
  token: string;
  profile: Partial<Profile>;
}

export const updateProfile = async (form: ProfileForm) => {
  try {
    const response = await axios.post("/account/profile", form);
    return response.data as Response<undefined>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

interface Login {
  identity: string;
  password: string;
}

export const login = async (form: Login) => {
  try {
    const response = await axios.post("/account/login", form);
    return response.data as Response<Credentials>;
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

interface ProblemResponse {
  id: string;
}

export const createProblem = async (form: CreateProblem) => {
  try {
    const response = await axios.post("/problem/create", form);
    return response.data as Response<ProblemResponse>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

export const fetchProblem = async (id: string, form?: Credentials) => {
  try {
    const response = await axios.post(`/problem/get/${id}`, form);
    return response.data as Response<UserProblem>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

interface ListProblem {
  identity: string;
  auth?: Credentials;
  limit?: number;
}

export const listProblems = async (form: ListProblem) => {
  try {
    const response = await axios.post("/problem/list", form);
    return response.data as Response<UserProblem[]>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

interface SubmitCodeForm {
  auth: Credentials;
  code: string;
  lang: string;
}

export const submitCode = async (problem_id: string, form: SubmitCodeForm) => {
  try {
    const response = await axios.post(`/code/submit/${problem_id}`, form);
    return response.data as Response<undefined>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};
