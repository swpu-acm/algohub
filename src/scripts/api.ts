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
  Submission,
  Contest,
  CreateContest,
  ContestProblem,
  ContestRank,
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

export const removeAsset = async (id: string, auth: Credentials) => {
  try {
    const response = await axios.delete(`/asset/delete/${id}`, {
      data: auth,
    });
    return response.data as Response<undefined>;
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

export const verifyToken = async (auth?: Credentials) => {
  try {
    const response = await axios.post("/account/verify", auth);
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

export const updateProblem = async (id: string, form: CreateProblem) => {
  try {
    const response = await axios.post(`/problem/update/${id}`, form);
    return response.data as Response<undefined>;
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

interface Id {
  id: string;
}

export const submitCode = async (problem_id: string, form: SubmitCodeForm) => {
  try {
    const response = await axios.post(`/code/submit/${problem_id}`, form);
    return response.data as Response<Id>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

export const fetchSubmission = async (id: string, form?: Credentials) => {
  try {
    const response = await axios.post(`/code/get/${id}`, form);
    return response.data as Response<Submission>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

export const listSubmissionsByProblemForAccount = async (
  id: string,
  account_id: string,
  auth: Credentials
) => {
  try {
    const response = await axios.post(
      `/code/list/${id}/account/${account_id}`,
      auth
    );
    return response.data as Response<Submission[]>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

export const listAllContests = async (auth: Credentials) => {
  try {
    const response = await axios.post("/contest/list/all", auth);
    return response.data as Response<Contest[]>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

export const createContest = async (data: CreateContest) => {
  try {
    const response = await axios.post("/contest/create", data);
    return response.data as Response<Id>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

export const listProblemsByContest = async (id: string, auth: Credentials) => {
  try {
    const response = await axios.post(`/contest/list/${id}/problems`, auth);
    return response.data as Response<ContestProblem[]>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

export const fetchContest = async (id: string, auth: Credentials) => {
  try {
    const response = await axios.post(`/contest/get/${id}`, auth);
    return response.data as Response<Contest>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
};

export const fetchRanks = async (id: string, auth: Credentials) => {
  try {
    const response = await axios.post(`/contest/rank/${id}`, auth);
    return response.data as Response<ContestRank[]>;
  } catch (error) {
    return handleAxiosError(AxiosError.from(error));
  }
}