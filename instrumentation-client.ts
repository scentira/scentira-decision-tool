import posthog from 'posthog-js';

const key=process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host=process.env.NEXT_PUBLIC_POSTHOG_HOST;
const localhost=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
const allowLocal=process.env.NEXT_PUBLIC_POSTHOG_ALLOW_LOCALHOST==='true';

if(key&&host&&(!localhost||allowLocal))posthog.init(key,{
  api_host:host,
  capture_pageview:true,
  autocapture:false,
  disable_session_recording:true,
  person_profiles:'identified_only',
  mask_all_text:true,
  mask_all_element_attributes:true,
});
