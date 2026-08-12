import { POST as LoginPOST } from "../auth/login/route";

export async function POST(request) {
  return LoginPOST(request);
}
