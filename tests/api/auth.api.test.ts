import { test, expect } from "@playwright/test";
import { EnvManager } from "../../src/utils/EnvManager";

const env = EnvManager.getInstance();

test.describe("Authentication API Tests", () => {
  test("@api TC_AUTH_001 - Should authenticate user with valid credentials", async ({
    request,
  }) => {
    const apiUrl = `${env.authApi}`;
    const payload = {
      username: "emilys",
      password: "emilyspass",
    };
    const response = await request.post(apiUrl, { data: payload });
    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.accessToken).toBeTruthy();
    expect(body.username).toBe("emilys");

    console.log(body.accessToken);
  });
});
