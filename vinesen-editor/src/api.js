import axios from "axios";
import { LANGUAGE_VERSIONS } from "./constants";

const API = axios.create({
  baseURL: "http://localhost:32000",
});
/*https://emkc.org/api/v2/piston*/

export const executeCode = async (language, sourceCode) => {
  try {
    const response = await API.post("/api/execute", {
      language: language,
      code: sourceCode,
    });

    return response.data;
  } catch (error) {
    console.log(error.response.data.error);
    throw new Error(error.response.data.error);
  }
};
