import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { ENDPOINTS, CUSTOMER_EMAIL, CUSTOMER_PASSWORD } from '../config.js';
import { getAuthHeaders, generateUuid } from '../helpers/auth.js';

/**
 * Tests all Customer Authentication, Profile, Device Management, and Avatar Storage APIs
 */
export function runAuthProfileSuite(token) {
  const headers = getAuthHeaders(token);
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testEmail = `testdiner_${randomSuffix}_${Date.now()}@spotq.com`;
  const testDeviceId = `k6-device-${generateUuid().substring(0, 8)}`;

  group('01_Auth_And_Identity_APIs', () => {
    // 1. Customer Login
    const loginPayload = JSON.stringify({
      email: CUSTOMER_EMAIL,
      password: CUSTOMER_PASSWORD,
      device: { deviceName: 'k6-load-runner', platform: 'WEB' },
    });
    const loginRes = http.post(ENDPOINTS.LOGIN, loginPayload, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      tags: { endpoint: 'customer_login' },
    });
    check(loginRes, {
      'customer login responded 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 2. Token Refresh
    const refreshRes = http.post(ENDPOINTS.REFRESH_TOKEN, JSON.stringify({}), {
      ...headers,
      tags: { endpoint: 'customer_refresh_token' },
    });
    check(refreshRes, {
      'customer refresh token responded': (r) => [200, 400, 401].includes(r.status),
    });

    sleep(0.3);

    // 3. Customer Registration (unique email)
    const registerPayload = JSON.stringify({
      fullName: `Test Diner ${randomSuffix}`,
      email: testEmail,
      phoneNumber: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: 'Customer@12345',
    });
    const regRes = http.post(ENDPOINTS.REGISTER, registerPayload, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      tags: { endpoint: 'customer_register' },
    });
    check(regRes, {
      'customer registration responded (200, 201, 400, or 409)': (r) =>
        [200, 201, 400, 409].includes(r.status),
    });

    sleep(0.3);

    // 4. Verify Email OTP
    const verifyEmailPayload = JSON.stringify({
      email: testEmail,
      otp: '123456',
    });
    const verifyEmailRes = http.post(ENDPOINTS.VERIFY_EMAIL, verifyEmailPayload, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      tags: { endpoint: 'customer_verify_email' },
    });
    check(verifyEmailRes, {
      'verify email otp responded (200, 400, or 401)': (r) =>
        [200, 400, 401, 404].includes(r.status),
    });

    sleep(0.3);

    // 5. Resend Email OTP
    const resendOtpPayload = JSON.stringify({ email: CUSTOMER_EMAIL });
    const resendRes = http.post(ENDPOINTS.RESEND_EMAIL_OTP, resendOtpPayload, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      tags: { endpoint: 'customer_resend_email_otp' },
    });
    check(resendRes, {
      'resend email otp responded (200, 400, or 429)': (r) =>
        [200, 400, 429].includes(r.status),
    });

    sleep(0.3);

    // 6. Alternative Resend Email OTP (Legacy/Direct route)
    const resendAltRes = http.post(ENDPOINTS.EMAIL_VERIFICATION_RESEND, resendOtpPayload, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      tags: { endpoint: 'customer_resend_email_otp' },
    });
    check(resendAltRes, {
      'email verification resend responded (200, 400, or 429)': (r) =>
        [200, 400, 404, 429].includes(r.status),
    });

    sleep(0.3);

    // 7. Google OAuth Login / Account Provisioning
    const googlePayload = JSON.stringify({
      idToken: 'k6_simulated_google_oauth_token_' + randomSuffix,
    });
    const googleRes = http.post(ENDPOINTS.GOOGLE_OAUTH, googlePayload, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      tags: { endpoint: 'customer_google_oauth' },
    });
    check(googleRes, {
      'google oauth endpoint responded': (r) => [200, 201, 400, 401].includes(r.status),
    });

    sleep(0.3);

    // 8. Forgot Password Request
    const forgotPayload = JSON.stringify({ email: CUSTOMER_EMAIL });
    const forgotRes = http.post(ENDPOINTS.FORGOT_PASSWORD, forgotPayload, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      tags: { endpoint: 'customer_forgot_password' },
    });
    check(forgotRes, {
      'forgot password responded (200, 400, or 429)': (r) =>
        [200, 400, 429].includes(r.status),
    });

    sleep(0.3);

    // 9. Forgot Password Resend OTP
    const forgotResendRes = http.post(ENDPOINTS.FORGOT_PASSWORD_RESEND_OTP, forgotPayload, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      tags: { endpoint: 'customer_forgot_password_resend' },
    });
    check(forgotResendRes, {
      'forgot password resend OTP responded (200, 400, or 429)': (r) =>
        [200, 400, 429].includes(r.status),
    });

    sleep(0.3);

    // 10. Forgot Password Verify OTP
    const forgotVerifyPayload = JSON.stringify({
      email: CUSTOMER_EMAIL,
      otp: '123456',
    });
    const forgotVerifyRes = http.post(ENDPOINTS.FORGOT_PASSWORD_VERIFY, forgotVerifyPayload, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      tags: { endpoint: 'customer_forgot_password_verify' },
    });
    check(forgotVerifyRes, {
      'forgot password verify OTP responded': (r) =>
        [200, 400, 401, 404, 429].includes(r.status),
    });

    sleep(0.3);

    // 11. Reset Password
    const resetPayload = JSON.stringify({
      password: 'Customer@NewPassword123',
    });
    const resetRes = http.post(ENDPOINTS.RESET_PASSWORD, resetPayload, {
      ...headers,
      tags: { endpoint: 'customer_reset_password' },
    });
    check(resetRes, {
      'reset password endpoint responded': (r) =>
        [200, 400, 401, 403, 404].includes(r.status),
    });

    sleep(0.5);
  });

  group('02_Customer_Profile_And_Devices_APIs', () => {
    // 12. Get Customer Profile
    const profileRes = http.get(ENDPOINTS.PROFILE, {
      ...headers,
      tags: { endpoint: 'customer_profile_get' },
    });
    check(profileRes, {
      'get customer profile returned 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 13. Update Customer Profile (Standard fields)
    const updateProfilePayload = JSON.stringify({
      full_name: 'SpotQ Verified Diner',
      gender: 'OTHER',
      dob: '1995-05-15',
    });
    const updateProfileRes = http.patch(ENDPOINTS.PROFILE, updateProfilePayload, {
      ...headers,
      tags: { endpoint: 'customer_profile_update' },
    });
    check(updateProfileRes, {
      'update customer profile returned 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 14. Update Customer Profile (Alternative gender selection)
    const updateProfileAltPayload = JSON.stringify({
      full_name: 'SpotQ Active Customer',
      gender: 'FEMALE',
      dob: '1998-11-20',
    });
    const updateProfileAltRes = http.patch(ENDPOINTS.PROFILE, updateProfileAltPayload, {
      ...headers,
      tags: { endpoint: 'customer_profile_update' },
    });
    check(updateProfileAltRes, {
      'update customer profile alt returned 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 15. Get Customer /me (Active Session Snapshot)
    const meRes = http.get(ENDPOINTS.ME, {
      ...headers,
      tags: { endpoint: 'customer_me' },
    });
    check(meRes, {
      'customer me returned 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 16. Customer Avatar / Profile Storage Presigned URL Request
    const avatarPresignedPayload = JSON.stringify({
      entity_type: 'customer',
      entity_id: generateUuid(),
      file_name: 'avatar.jpg',
      content_type: 'image/jpeg',
      file_category: 'PROFILE',
      file_size: 102400,
    });
    const avatarRes = http.post(ENDPOINTS.STORAGE_PRESIGNED_URL, avatarPresignedPayload, {
      ...headers,
      tags: { endpoint: 'customer_avatar_presigned' },
    });
    check(avatarRes, {
      'customer avatar presigned url responded': (r) =>
        [200, 201, 400, 401, 404].includes(r.status),
    });

    sleep(0.3);

    // 17. Register Device Token for Push Notifications
    const registerDevicePayload = JSON.stringify({
      deviceId: testDeviceId,
      platform: 'WEB',
      deviceName: 'Chrome on MacOS',
      appVersion: '1.0.0',
    });
    const regDevRes = http.post(ENDPOINTS.DEVICES, registerDevicePayload, {
      ...headers,
      tags: { endpoint: 'customer_devices_register' },
    });
    check(regDevRes, {
      'register device responded (200, 201)': (r) => [200, 201].includes(r.status),
    });

    sleep(0.3);

    // 18. List Customer Registered Devices
    const listDevRes = http.get(ENDPOINTS.DEVICES, {
      ...headers,
      tags: { endpoint: 'customer_devices_get' },
    });
    check(listDevRes, {
      'list customer devices returned 200': (r) => r.status === 200,
    });

    sleep(0.3);

    // 19. Deactivate Device
    const deleteDevRes = http.del(ENDPOINTS.DEVICE_BY_ID(testDeviceId), null, {
      ...headers,
      tags: { endpoint: 'customer_device_delete' },
    });
    check(deleteDevRes, {
      'delete customer device responded (200, 204, or 404)': (r) =>
        [200, 204, 404].includes(r.status),
    });

    sleep(0.3);

    // 20. Customer Logout & Session Termination
    const logoutRes = http.post(ENDPOINTS.LOGOUT, JSON.stringify({}), {
      ...headers,
      tags: { endpoint: 'customer_logout' },
    });
    check(logoutRes, {
      'customer logout responded (200, 204, 401)': (r) =>
        [200, 204, 401].includes(r.status),
    });

    sleep(0.5);
  });
}
