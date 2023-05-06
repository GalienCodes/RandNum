import axios from "axios";

axios.defaults.baseURL = "https://randnum.fly.dev/lottoGame";
axios.defaults.headers.post["Content-Type"] = "multipart/form-data";
