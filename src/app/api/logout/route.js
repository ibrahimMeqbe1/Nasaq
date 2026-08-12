import { POST as LogoutPOST, GET as LogoutGET } from "../auth/logout/route";

export async function POST(request) {
  return LogoutPOST(request);
}

export async function GET(request) {
  return LogoutGET(request);
}
