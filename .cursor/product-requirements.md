# GMATHS Online Testing Platform Project Requirements

## Introduction
GMATHS Education is developing a comprehensive online testing platform for mathematics and related subjects (STEAM). The platform will allow students to take practice tests and formal exams entirely online, providing an interactive and secure environment. This Project Requirements Document (PRD) outlines the features and specifications of the platform in detail for implementation by an AI coding agent. The system is intended to support high concurrency (up to 1,500 simultaneous users) while running on a modest server instance (e.g., AWS t2.small), using modern, optimized, and secure technologies. All user-facing interfaces will be in Vietnamese to serve GMATHS’s student audience, though development and code documentation will be in English. The platform must align with GMATHS Education’s visual identity and ensure no requirement is missed or misinterpreted, enabling an AI to develop the system with minimal human intervention.

## Objectives and Goals
- **Interactive Math Testing:** Provide students with an intuitive online platform to practice and take exams in mathematics and integrated STEAM subjects.
- **Robust Exam Management:** Enable administrators (GMATHS educators) to easily create, schedule, and manage a variety of tests and question types.
- **Fair and Secure Environment:** Implement anti-cheating measures and secure data handling to ensure exam integrity and protect student information.
- **High Performance:** Ensure the platform can handle heavy usage (up to 1,500 concurrent users) efficiently on minimal hardware, with optimized performance.
- **Brand Alignment:** Deliver a user interface consistent with GMATHS Education’s branding (logo, colors, tone), and present content in Vietnamese for the end-users.
- **Accessibility and Inclusivity:** Design the platform to be accessible to all students, including those with disabilities, and compliant with data protection standards.

## User Roles and Personas
- **Student (Primary User):** A student (typically school-aged) who uses the platform to take practice tests and scheduled exams. Students will log in, access assigned tests, complete exams under timed conditions, and view their results.
- **Administrator (Educator/Content Creator):** GMATHS Education staff or teachers who manage the platform. Administrators create and organize exam content, schedule exam availability, manage question banks, oversee student registrations, and review results. They ensure tests are properly set up and monitor for any irregularities during exam sessions.
- **(Optional) Parent/Guardian:** While parents/guardians may not log in directly, they are stakeholders who will receive exam results or monitor their child’s progress. The system may send them notifications or reports via email, or they may view results through the student’s account.

*(No separate teacher role is defined if administrators fulfill content creation duties. The system can be extended in future to include teacher or proctor roles if needed.)*

## Functional Requirements

### 1. User Registration and Management
- **Student Registration:** The platform shall allow new students to register for an account. Registration may require personal information such as full name, age/grade, email (and/or parent’s email for minors), and a password. Passwords must be stored securely (hashed and salted).
- **Account Activation:** The system must verify user email addresses (e.g., via a confirmation link) before activating a new student account. Alternatively, an administrator can create student accounts in bulk and provide login credentials.
- **Login/Authentication:** Students shall log in with their email/username and password. Implement secure authentication (with an option for two-factor authentication if needed for additional security, though not mandatory initially).
- **Password Recovery:** Provide a secure “Forgot Password” mechanism (e.g., password reset link sent to the registered email). After verification, the student can set a new password.
- **Profile Management:** Students can view and update their profile information (such as name, contact email) except certain fields like grade which may be locked or require admin approval to change. Personal data changes that affect exam assignment (like changing grade level) should notify administrators.
- **Admin User Management:** Administrators shall be able to create, edit, or deactivate student accounts. Admins can reset student passwords and update student details if needed. The system should allow managing user roles (e.g., assigning or revoking admin privileges for staff accounts).
- **Security for Accounts:** Implement measures like login attempt limits (e.g., lock account temporarily after 5 failed attempts) to prevent brute force attacks. Ensure sessions are secure and timeout after a period of inactivity.
- **Concurrency Support:** The user management and authentication system must handle many simultaneous logins and sessions (e.g., during an exam window) without performance degradation. Use efficient session handling and possibly stateless session tokens to support up to 1,500 concurrent users.

### 2. Exam Creation and Configuration (Administrator)
- **Question Bank:** The platform shall provide a question bank where admins can create and store questions. Questions can be categorized by subject (Math, Science, etc.), topic, difficulty level, grade, and tags. This allows reuse of questions in multiple tests and easy retrieval.
- **Question Types:** Support a variety of question formats to accommodate different assessment needs:
  - *Multiple Choice (single answer):* Question with several options and one correct answer.
  - *Multiple Select (multiple correct answers):* Question where more than one option is correct. Students must select all the correct options to get full points (partial scoring can be enabled or disabled by admin).
  - *True/False:* A statement that students mark as either true or false.
  - *Fill-in-the-Blank:* Students provide a word, phrase, or numerical answer. The system allows specification of acceptable answers (including multiple possible correct answers or a numeric range tolerance).
  - *Short Answer/Essay:* Students write a free-text response. This type will require manual grading by an administrator or teacher.
  - *Matching:* Students match items in two lists (e.g., match terms with definitions). The UI may allow dragging lines between matches or selecting matching pairs from dropdowns.
  - *Ordering/Sequencing:* Students arrange items in the correct order (e.g., steps of a process). The platform captures the student’s sequence and compares it to the correct sequence for grading.
  - *Math Expression/Equation:* (If applicable) Support questions where students input a mathematical expression or equation as an answer. This could be via a specialized math input field or LaTeX. Automatic evaluation can be implemented for simple cases (exact match or numeric result), otherwise manual review may be needed.
  - *Media-based Questions:* (Optional) The system should allow embedding images or diagrams with questions, and possibly audio/video clips for questions (e.g., listening comprehension or experimental observation). Students might answer based on media; ensure compatibility and performance if used.
  - Each question in the bank should store the question text (in Vietnamese or English as needed), the correct answer(s), explanation/solution (for feedback), and metadata (type, difficulty, etc.). 
- **Exam Paper Assembly:** Administrators can create an exam by selecting and compiling a set of questions (from the question bank or by writing new ones on the fly). They should be able to:
  - Set the exam title, description, and instructions (all visible to students in Vietnamese).
  - Organize the exam into sections if desired (e.g., Section I: Math, Section II: Science). Each section can have its own instructions and a subset of questions. Admin can optionally set per-section time limits or adaptive navigation (e.g., once a section is finished, cannot return).
  - Determine the order of questions (fixed order or randomize the order for each student). The system should support both modes.
  - Assign point values to each question. The platform should sum these for the total exam score. Optionally allow weighting sections or setting certain questions as extra credit.
  - Mark questions that require manual grading (so the system knows the exam grading is not complete until those are graded).
  - Specify if the exam is practice (allowing multiple attempts and showing answers) or formal (limited attempts, stricter rules).
- **Exam Settings and Parameters:** For each exam, administrators shall configure:
  - **Time Limit:** Total duration allowed for the exam (e.g., 60 minutes). A countdown timer must be shown to students during the attempt. Admin can also choose "untimed" for practice quizzes.
  - **Availability Window:** The start date/time when the exam becomes available to students and the end date/time when it closes. Outside this window, the exam cannot be started (and is hidden or marked inactive).
  - **Attempt Limits:** How many attempts each student is allowed (e.g., unlimited attempts for practice tests, or 1 attempt for a formal exam). If multiple attempts are allowed, admin can decide which score counts (highest, latest, average, etc.).
  - **Navigation Control:** Whether students can revisit previous questions. Options might include:
    - Free navigation (can move back and forth between questions).
    - Linear navigation (cannot go back once they proceed).
    - Section-locked (can move within a section but not back to previous sections).
  - **Randomization:** Option to randomize the order of questions and/or randomize the order of multiple-choice answers for each student to reduce cheating.
  - **Grading and Feedback Policy:** Configure whether students see their results immediately after submission or later. For immediate feedback (common in practice tests), the system can show score per question and correct answers/explanations. For delayed feedback (common in formal exams), the system might only show a submission confirmation until admins release scores.
  - **Passing Criteria:** Optionally set a passing score or grade boundary for the exam. This can be used to automatically determine outcomes like pass/fail status or eligibility for certificates.
  - **Proctoring Requirements:** Indicate if any special proctoring will be used (even if outside the system) so that the platform can accommodate (for example, requiring a password to start the exam given by a proctor, or scheduling all students to start at the same time).
- **Draft and Publish Exams:** Admins should be able to save an exam as a draft (not visible to students) and publish it when ready. Students only see published exams that are within their availability window.
- **Accommodations:** The system should allow administrators to grant specific accommodations for individual students if needed (for example, extended time for students with special needs, or a different availability window). This could be configured by selecting a student and adjusting their time limit or attempt count for a particular exam.

### 3. Exam Delivery and Student Experience
- **Student Dashboard:** Upon login, a student sees a dashboard (in Vietnamese) showing relevant information:
  - Upcoming exams they are registered for, with dates and a “Start” button activated when the exam window opens.
  - Available practice tests or quizzes that they can take at any time (if any).
  - Recent results or completed exams with scores, and a link to review those results (if review is allowed).
- **Exam Instructions Page:** When a student clicks to start an exam, the platform first displays an instruction/overview page. This includes the exam name, duration, number of questions, allowed attempts (if more than one), and rules (for example, “Do not refresh the page”, “You cannot go back to previous questions”, etc., based on settings). The student must confirm readiness (e.g., a “Start Now” button) to begin and start the timer.
- **Exam Interface:** 
  - The platform will present questions one at a time or a few per page according to the design (one question per page is recommended for focus and to simplify navigation on smaller screens). Each question page clearly indicates the question number and the total number of questions or sections.
  - **Timer:** A persistent timer display counts down remaining time. It should be visible at all times (e.g., top corner of the screen). Provide a warning (visual and/or audio cue) when time is almost up (e.g., at 5 minutes remaining and 1 minute remaining).
  - **Answer Input:** Students answer each question using the appropriate control:
    - Multiple choice/select: clickable options (radio buttons or checkboxes).
    - True/False: radio buttons or a toggle.
    - Short answer/number: a text input field (with proper validation for numeric answers).
    - Essay: a larger text area.
    - Matching: an interactive matching widget (drag-and-drop or dropdown matching).
    - Ordering: a drag-and-drop list or up/down controls to rearrange items.
    - Math expression: a special input field or graphical editor if available.
  - **Navigation Controls:** Provide “Next” and “Back” buttons if backward navigation is allowed. If not allowed, only “Next” and a clear indication that once submitted or moved forward, answers are locked. If the exam allows skipping questions and returning later, provide a question navigation panel (e.g., a list of question numbers that the student can click to jump to any question, with markers for answered/unanswered).
  - **Save and Autosave:** The system must save the student’s answers in real-time or at least frequently. Every time a student moves to another question or after a short interval, save progress to prevent data loss. Also, allow a manual “Save” button in case the student wants to ensure the answer is recorded (especially for essay questions).
  - **Exam Submission:** A student can choose to submit the exam early if they finish before the time is up. They should be prompted to confirm submission (to avoid accidental submits). When time expires, the exam should auto-submit. After submission, show a confirmation that the attempt was received.
  - **Responsive Design:** The exam interface must be fully responsive to support desktops, tablets, and smartphones. On smaller screens, the layout should adjust (e.g., using vertical stacking of options, larger buttons for touch, etc.) so that it's easy to read and interact with questions.
- **Mid-Exam Interruptions:** 
  - If a student loses internet connection or closes the browser accidentally, the system should allow them to resume the exam where they left off, provided the exam time window and timer have not elapsed. The saved answers should be loaded when they resume.
  - If the exam timer was still running during disconnect (since the timer is server-tracked), the remaining time should be recalculated upon re-login. If time expired while they were disconnected, the exam might be auto-submitted.
  - These scenarios should be logged (so admin knows if a student had connection issues).
- **Language and Instructions:** All on-screen text (aside from test content) will be presented in Vietnamese, phrased in a clear and age-appropriate manner. For example, use simple instructions like “Chọn câu trả lời đúng nhất” (choose the most correct answer) for multiple-choice directions. The tone should be encouraging and calm, e.g., “Hãy bình tĩnh làm bài và kiểm tra lại trước khi nộp bài.” The interface should avoid complex terminology, making it easy for young students to understand.

### 4. Scoring, Grading, and Feedback
- **Automatic Grading:** The system will automatically grade all objective question types:
  - Multiple choice/single answer: full points for selecting the correct answer, zero for incorrect.
  - Multiple select: if all correct options are chosen and no incorrect options selected, full points; if partially correct, scoring can be configured (e.g., all-or-nothing vs partial credit for each correct selection minus incorrect selections).
  - True/False: full points for correct selection, zero for incorrect.
  - Fill-in-the-blank / Numeric: compare the student’s answer to the expected answer(s). Accept minor variations if configured (e.g., case insensitive text, or a numeric tolerance such as ±0.1 for an answer like 3.14). The admin can set acceptable answers when creating the question (including multiple correct synonyms or formats).
  - Matching: each correctly matched pair could give partial points, or require all matches for full points (configurable scoring method, but default to partial credit per correct pair).
  - Ordering: similarly, could give partial credit for each item in correct position or sequence completely correct only.
- **Manual Grading:** For subjective responses (e.g., essay questions), the system will flag these for manual grading:
  - Administrators can access a grading interface listing all students’ responses to a particular essay question (or by student).
  - The admin enters a score for each response. They may also write feedback comments in Vietnamese (or English, but likely Vietnamese if the feedback is for the student).
  - After manual scores are entered, the system adds them to the automatic scores to finalize the student’s total score for the exam.
  - Admin should be able to mark grading as complete for an exam once all manual questions are graded.
- **Result Calculation:** The platform calculates each student’s total score and optionally a percentage or grade based on the points earned out of total possible. If a passing criterion was set, mark whether the student passed or failed. All calculations must be accurate and double-checked (consider edge cases like unanswered questions, partial credit sums, etc.).
- **Student Result View:** 
  - For practice tests (immediate feedback mode): Upon submission, the student is shown their score and possibly detailed feedback. Detailed feedback can include each question, the student’s answer, the correct answer, and an explanation or solution (if the admin provided explanations in the question bank). This review helps students learn from mistakes.
  - For formal exams (delayed feedback mode): Upon submission, the student might only see a message like “Your exam has been submitted successfully.” Once the admin releases the results, the student can then view their score and any permitted feedback by logging into their account. The system should notify students when results are available.
  - In either case, the result page should be clear and well-formatted in Vietnamese. For example: “Điểm của bạn: 85/100. Bạn đã ĐỖ.” (Your score: 85/100. You have PASSED.) If detailed review is available: list questions and indicate correct/incorrect.
- **Analytics and Reports for Admin:**
  - The admin interface will include an overview of exam results. For a given exam, it can show summary statistics: number of students who took it, average score, highest and lowest score, standard deviation, etc.
  - Provide per-question analysis: e.g., what percentage of students got each question correct. Highlight questions that most students missed (could indicate a tricky question or a topic to review in teaching).
  - Allow filtering results by class or group if relevant (e.g., if the platform is later used across multiple classes or schools).
  - Admin should be able to export the results data (e.g., as CSV) for offline analysis or record.
- **Leaderboard (Optional):** If appropriate for the use case (e.g., in a competitive context), implement a leaderboard showing top performers for a particular exam or cumulative performance over multiple tests. This feature should be used carefully (maybe only for competitions) and can be toggled on/off by admins. If used, display only necessary info (like student names and scores) and ensure privacy (maybe use nicknames or codes if needed).
- **Certificate Generation (Optional):** For formal exams or competitions, the system could generate a certificate for students who meet certain criteria (e.g., pass the exam or top 10%). This would include the student’s name, exam name, achievement, and date. Certificates could be downloadable PDFs with GMATHS branding.

### 5. Anti-Cheating and Exam Integrity Measures
To ensure exam integrity in an unsupervised online environment, the platform will incorporate several anti-cheating features:
- **Unique Exam Instances:** Each student’s exam instance can be slightly different:
  - Question order is randomized per student (if enabled).
  - Answer choices for multiple-choice questions are shuffled.
  - For large question banks, the admin could set an exam to draw a random subset of questions for each student (e.g., each student gets 20 out of a pool of 30 questions). This makes it less effective to copy answers.
- **Identity Verification:** At login or exam start, optionally prompt the student to confirm their identity (e.g., show their name and ask them to confirm, or even take a photo via webcam if needed for certain exams). This is an advanced option that could be enabled for high-stakes tests.
- **Single Device Enforcement:** Prevent simultaneous logins for the same account. If a student is logged in and an additional login occurs elsewhere, automatically log out the first session or disallow the new login. During an active exam, do not allow the student to start the exam on another device.
- **Full-Screen Mode & Focus Tracking:** Encourage students to take the exam in full-screen mode. The system should detect if the exam window/tab loses focus (using browser APIs). If the student navigates away from the exam (alt-tabs or switches windows), record an event. Optionally, display a warning to the student after one or two switch-away events (e.g., “Vui lòng tập trung vào màn hình làm bài thi. Nếu bạn rời khỏi trang nhiều lần, bài thi có thể bị hủy.” meaning "Please stay on the exam screen. If you leave the page repeatedly, your test may be invalidated."). These events should be logged for admins.
- **Disable Copy/Paste:** While on the exam page, standard copy-paste keyboard shortcuts and right-click context menu can be disabled for question text and options, to make it harder to quickly copy questions or search answers. (Note: This is a deterrent and not foolproof as determined users can still use other devices, but it raises the bar.)
- **Browser Limitations:** Do not allow the exam to run concurrently in multiple tabs or windows. If a duplicate session is detected, alert the student and possibly end the exam session (with a warning).
- **Time Analytics:** The system can track the time spent on each question. Unusually fast completion (e.g., finishing a 60-minute exam in 5 minutes) or very little time on each question might indicate cheating (or guessing). These attempts can be flagged for review.
- **Post-exam Answer Release:** To prevent sharing of answers, if an exam is still ongoing for some students (e.g., in a window), do not show correct answers to any student until the exam window closes. For example, in practice mode where the exam is always open, that’s fine; but in a formal exam from 10:00 to 11:00, if one student finishes at 10:30 they should not immediately see correct answers because others are still taking it. The platform should delay feedback until the exam is over for everyone.
- **Proctoring via Webcam (Optional):** For important exams, the platform could integrate a proctoring feature where the student’s webcam is activated during the exam. It could capture periodic snapshots or stream to an admin dashboard. This must be used in compliance with privacy policies and with user consent. (This is a complex feature and can be planned as a future enhancement; design should keep it in mind.)
- **Secure Data and Code:** Ensure that the front-end does not expose sensitive data. For instance, the correct answers should never be sent to the client side until after the exam (and even then, only if showing feedback). All crucial checks (like time enforcement, answer validation) must happen server-side to prevent tampering via client-side scripts.
- **Audit Log for Attempts:** Maintain detailed logs of each exam attempt: start time, end time, IP address, events like window blur/focus changes, any warnings shown, etc. If any attempt is flagged due to suspicious activities, mark it in the results for admins to examine. Admins should have a view to see these logs for a particular student’s attempt if needed.
- **Cheating Consequence Management:** The system itself will not automatically disqualify or punish a student beyond maybe auto-submitting if they leave too much, but it will provide data for admins. It’s up to GMATHS staff to decide if an attempt is invalid. However, the system could implement basic rules if required (e.g., after 3 warnings of leaving screen, auto-end the exam).

### 6. Scheduling and Notifications
- **Exam Scheduling:** As configured by admin, exams have defined availability windows. The system’s backend should ensure these are strictly enforced (cannot start before start time, cannot start after end time). Use server time to avoid client manipulation.
- **Notification Emails:** 
  - When an exam is scheduled for a future date, the system should send an email notification to each eligible student (and/or their parent’s email) X days before the exam, reminding them of the upcoming test with date/time details. It can also send a reminder on the day of the exam, a couple of hours before the start.
  - For practice tests that are continually available, an initial notification might announce its availability, but repeated reminders aren’t needed since they’re on-demand.
  - All emails should be in Vietnamese and can include GMATHS branding.
- **In-App Notifications:** Besides emails, when students log into the platform, they should see notifications for:
  - New exams assigned to them or available.
  - Exams starting soon (e.g., “Bài kiểm tra Toán tháng 5 sẽ bắt đầu sau 1 ngày” – "The May Math test will start in 1 day").
  - Results posted (e.g., “Kết quả bài thi X đã có. Nhấn vào đây để xem.” – "Results for exam X are now available. Click here to view.").
  - These notifications should be clearly visible on the dashboard or perhaps via an icon (bell icon for notifications).
- **Calendar Integration (Optional):** Allow students (and parents) to download or sync an exam schedule to their calendars (iCal/Google Calendar link) so they automatically get reminders. (This is a nice-to-have feature.)
- **Rescheduling and Extensions:** Admins can adjust exam schedules if necessary:
  - If an exam needs to be postponed, they can change the open/close times (if before it starts or even during it, perhaps extending the close time).
  - If only specific students need an extension (e.g., due to technical difficulties), admin can reopen the exam for those students or provide a make-up exam (the system might allow a duplicate exam instance just for them).
  - Such changes should trigger notifications to affected students.
- **System Time and Time Zones:** The system will use a single time zone standard (likely the GMATHS local time, UTC+7). Display all times with the timezone or clearly as local time. If remote students from other time zones are possible, clarify time zone in communications.
- **Exam Overlaps:** If a student has overlapping exam windows (not likely if one organization schedules them, but possible if multiple practice tests open), the system should handle it gracefully, allowing the student to decide which to take first. Ideally, avoid scheduling conflicts; the calendar view for admins should help.
- **Continuous Availability for Practice:** Some exams (practice quizzes) might have a very long availability (open indefinitely). The system should handle such open-ended availability without issues. For instance, a “Math practice quiz” could always be available for unlimited attempts.

### 7. User Interface & Branding Requirements
- **Language and Localization:** All user interface text must be in Vietnamese. This includes navigation menus, form labels, buttons, messages, error notifications, etc. Example: use “Đăng nhập” for “Login”, “Mật khẩu” for “Password”, etc. Ensure proper diacritics are displayed. The content of questions can be in Vietnamese or English (as input by admins), but system-provided UI and default text are in Vietnamese. Internally, the development (code comments, variable names) will be in English.
- **Look and Feel Consistent with GMATHS:** The UI design should follow GMATHS Education’s branding guidelines:
  - **Logo:** Include the official GMATHS Education logo on key pages (login page, main dashboard header). Ensure the logo is clearly visible and not distorted. Clicking the logo could navigate to the main GMATHS website or the dashboard.
  - **Color Scheme:** Use GMATHS brand colors throughout. Likely primary color (for headers or highlights) is a shade of blue (from the globe in the logo), with secondary accents in orange, green, and possibly red for emphasis (like error messages or important highlights, matching the logo text color). Use these colors in a balanced way: e.g., primary buttons in the blue or orange, info messages in green, etc., to create a vibrant yet professional educational feel.
  - **Typography:** Use clean, easy-to-read fonts that support Vietnamese characters. The font should be modern and friendly. Ensure titles and body text are appropriately sized (children might benefit from slightly larger text than typical).
  - **Visual Elements:** The design should be student-friendly but not overly childish (as it caters to a range of ages). Possibly include simple icons (for example, a pencil icon for “take test”, a trophy icon for results/achievements, etc.). Avoid clutter and maintain a professional academic tone.
  - **Tone:** All text in the UI should use polite and encouraging language appropriate for students. E.g., after submission, say “Chúc mừng bạn đã hoàn thành bài thi!” ("Congratulations on completing the test!") instead of a dry message. If an answer is wrong in practice mode, maybe an encouraging note like “Bạn hãy xem lại bài giải và thử lại lần nữa nhé!” ("Review the solution and try again!").
- **UI Structure:**
  - **Navigation for Students:** Provide a simple top navigation or menu. Likely just basics like “Trang chủ” (Home/Dashboard), “Bài kiểm tra” (Tests), “Kết quả” (Results), and profile/settings. Keep it minimal to avoid confusion.
  - **Navigation for Admins:** Admin interface may have more menu items: Dashboard, Questions, Exams, Results, Users, Settings. Clearly separate admin functions from student interface (non-admin users should never see admin menus).
  - The UI should prevent students from accidentally accessing admin pages (enforce permissions on frontend and backend).
- **Responsive and Cross-Browser:** Ensure the layout works on common browsers (Chrome, Firefox, Edge, Safari) and devices. Use responsive design approaches (CSS flex/grid, media queries) to adapt the layout. Test on mobile screens to ensure buttons are touch-friendly and text is readable without zoom.
- **Consistency:** Maintain a consistent layout and style across the platform. For instance, all forms should look and behave similarly (labels above inputs, consistent button styling), all lists or tables (like a results table) should use the same design language.
- **Error Messages and Validation:** All form validations (e.g., registration form, answer formats) should provide clear feedback in Vietnamese. For example, “Vui lòng nhập địa chỉ email hợp lệ” ("Please enter a valid email address") for an invalid email. Use inline validation where appropriate (highlight fields in red, etc.).
- **Confirmation and Feedback:** Use modals or messages to confirm actions: e.g., “Bạn có chắc chắn nộp bài?” ("Are you sure you want to submit?") when clicking submit. After actions like saving a profile or creating an exam, show a success message (“Lưu thành công!” - "Saved successfully!").
- **Accessibility in UI:** As noted, ensure color choices have sufficient contrast, add focus outlines for keyboard users, etc. If any student might use screen readers, ensure ARIA labels on custom components (like the matching or ordering widgets) are present.

## Non-Functional Requirements

### Performance and Scalability
- **Concurrent Users:** The platform must handle at least 1,500 concurrent users actively using it (e.g., taking exams simultaneously). It should remain stable and responsive under this load. Use optimized algorithms and queries to ensure quick page loads and minimal server strain. For instance, loading questions should fetch only necessary data and perhaps prefetch a few to reduce wait time during the exam.
- **Server Requirements:** The application is expected to run on a single AWS t2.small instance (or equivalent hardware) initially. This constraint means the software must be efficient in CPU and memory usage. As such, avoid memory leaks, use caching for repeated computations (like question data that is reused), and optimize database accesses with indexing and proper query design.
- **Latency and Response Times:** Aim for a response time of under 2 seconds for most user actions even under load. For example, after a student submits an answer or navigates to the next question, the next question should load within a couple of seconds at most. The system should feel responsive and not laggy.
- **Scalability Plan:** Although a single small instance is the initial target, design the system to allow future scaling. This includes:
  - Using load balancer-friendly session management (e.g., stateless JWT tokens or sticky sessions if needed).
  - Structuring the application so that moving to a distributed setup (separating database server, using cloud managed services, etc.) would not require a complete rework.
  - Possibly allow horizontal scaling of stateless components if needed in the future (for example, multiple application servers serving the same database).
- **Testing for Performance:** Include performance testing in the development process. Simulate exam scenarios with 1500 concurrent users (or more) to ensure the system meets the requirement. Identify bottlenecks (if any) and optimize accordingly. This might involve optimizing code or queries, adding caching layers, or tuning server configuration.
- **Resource Management:** Use background jobs for any heavy tasks that need not block user interactions. For instance, if generating a complex report or sending bulk emails, handle those outside the main request cycle so the user-facing parts remain fast.
- **Graceful Degradation:** If the system is overloaded beyond expected capacity, it should fail gracefully. For example, it might queue incoming requests rather than crashing, or temporarily restrict some non-critical functions (like report generation) when under heavy load. Always prioritize the exam-taking functionality to ensure students can continue their tests.

### Security and Data Protection
- **Secure Transmission:** All communication between client and server must be encrypted via HTTPS. Obtain and configure a TLS certificate for the platform’s domain to protect user credentials and data in transit.
- **Data Storage Security:** Protect personal data and exam data in storage:
  - Passwords must be hashed (using a strong hashing algorithm like bcrypt or Argon2) and never stored in plaintext.
  - Other sensitive data (like personal information on students) should be stored securely. If any particularly sensitive personal info is collected (e.g., maybe birthdate), consider encryption at rest for those fields in the database.
  - Ensure database backups (if any) are also stored securely (encrypted) since they contain personal data and exam results.
- **Access Control:** Enforce proper authorization on all API endpoints and pages. Students should only access their own data. Admin endpoints must be protected to allow only authorized admin accounts. This prevents malicious users from attempting to retrieve data that isn’t theirs by altering requests.
- **Input Validation:** All inputs (including exam answers, which might be essay text or file uploads if allowed) should be validated and sanitized to prevent injection attacks. Use prepared statements or ORM for database interactions to avoid SQL injection. Neutralize any HTML or script content in text inputs to prevent XSS when displaying results or feedback.
- **Session Management:** Use secure cookies (HTTPOnly and Secure flags) for sessions if using cookie-based auth. Implement proper session timeout and rotation (e.g., log out users after some hours of inactivity, and refresh session tokens periodically to reduce risk of stolen tokens being reused).
- **Audit Logging:** Maintain logs of key events (logins, important admin actions like exam creation or deletion, changes to user data, and unusual events like multiple failed logins, flagged cheating events). These logs can be reviewed to detect any security issues or unauthorized attempts. Store logs securely and ensure they do not themselves expose sensitive info (e.g., don’t log full passwords, etc.).
- **Data Privacy Compliance:** Adhere to relevant data protection principles:
  - Only collect necessary data from students. Likely name, email, school/grade. Avoid collecting excessive personal information.
  - Provide a privacy policy to users (outside scope of PRD content, but the system should have a page for it).
  - Allow users (or their parents) to request deletion of their account/data. Administrators should have the ability to remove a student’s personal data if required (while perhaps keeping anonymized exam statistics).
  - If students are under a certain age (like under 13), ensure the platform either obtains parental consent for account creation or clearly involves the parent’s email in communications, following regulations for minors using online services.
- **Third-Party Compliance:** If the system uses any third-party services (like email delivery, analytics, etc.), ensure those services are GDPR-compliant or have proper data handling agreements if any user data is passed to them.
- **Secure Development:** All technology choices and coding practices should prioritize security. Use frameworks that are up-to-date and receive security patches. Avoid using deprecated libraries. Conduct security testing (or code scanning) to catch vulnerabilities early.
- **Regular Updates:** Plan for regular updates of the system’s software (framework updates, dependency updates, etc.) to patch any security issues. If a vulnerability is found, the team should be able to quickly update the system to fix it.

### Accessibility and Inclusivity
- **Standards Compliance:** Follow WCAG 2.1 AA guidelines for accessibility to ensure the platform is usable by students with disabilities.
- **Keyboard Navigation:** All features should be accessible via keyboard. For example, a student who cannot use a mouse should be able to tab through the login form and exam questions and select answers (radio buttons/checkboxes should be focusable and toggle-able via keyboard).
- **Screen Reader Support:** Use semantic HTML elements and ARIA labels where necessary so that screen reader software can properly convey the interface. For instance, each question should be announced with its number and any prompt text, and answer choices should be grouped and labeled.
- **Color and Contrast:** Ensure sufficient contrast between text and background colors (contrast ratio at least ~4.5:1 for normal text). This is especially important given the brand colors – if a color like light green is used on white, it needs to be dark enough to read.
- **No Reliance on Color Alone:** Do not use color as the sole way to convey information (e.g., don’t just highlight a wrong answer in red without also providing a text or icon indicator).
- **Resizable Text:** The interface should remain functional when zoomed in. Users should be able to use browser zoom up to 200% without loss of content or functionality.
- **Avoiding Rapid Flashes:** Avoid any content that flashes rapidly or could harm users with photosensitive epilepsy. The design likely doesn’t require any flashing content, but ensure any animations (if used) are subtle and safe.
- **Inclusive Wording:** In Vietnamese, ensure the language is respectful and inclusive. Avoid idioms or complex language that might confuse younger students or non-native speakers (though presumably all users are Vietnamese students, some content is English as subject matter but that’s separate).
- **Alternate Formats:** If a student has a documented need (e.g., visual impairment), the platform’s design should allow for possible accommodations such as providing exam content in an alternate format. While implementation of, say, Braille output is beyond scope, ensuring the content can be extracted in text form by assistive tools is key (which ties back to using proper HTML).
- **Testing Accessibility:** As part of QA, test the platform with accessibility evaluation tools (for contrast, screen reader navigation, etc.) to catch any issues.

### Development and Project Constraints
- **Development Language:** The development (including code comments, commit messages, and documentation) will be done in English. This ensures clarity since programming languages and frameworks are generally in English and it allows broader collaboration. However, any content delivered to end-users is in Vietnamese as specified.
- **Technology Stack:** The choice of technology is flexible but must meet the requirements:
  - Use modern web development frameworks and libraries appropriate for 2025. (For example, a contemporary front-end framework for the UI and a robust back-end framework or language for server logic and database interactions.)
  - Ensure all components are optimized and secure. For instance, if using a front-end framework, build for production with minification and bundling for performance. If using a database, choose one that can handle concurrency and use indexing.
  - Avoid outdated or unmaintained libraries that could pose security risks.
- **Modularity and Clarity:** The codebase should be structured in a modular way to allow the AI (and future developers) to manage and expand it:
  - Separate concerns (e.g., a module for question management, a module for exam scheduling, etc.).
  - Write clear, self-documenting code as much as possible. Use consistent naming and file organization.
  - Include comments for complex logic or calculations (in English).
- **Testing and QA:** The AI agent should also produce automated tests or at least make the system easily testable. Key functionalities like grading logic, time enforcement, and the anti-cheating event logging should have tests. Additionally, cross-browser testing is needed for the front-end to ensure consistent behavior.
- **Deployment Environment:** The system should be containerizable or easy to set up on the server. Given it needs to run on a t2.small, the deployment must be lightweight. Possibly use Docker for environment consistency (keeping resource usage in check). Provide instructions or scripts to set up the server (install dependencies, initialize the database schema, etc.).
- **Maintenance:** Ensure that adding new features later (like more question types, or scaling out) is feasible without rewriting core components. For instance, if adding a new question type, the system’s architecture (both in code and in the question bank schema) should allow it to be added with minimal changes.
- **Monitoring & Error Reporting:** Implement basic monitoring hooks: e.g., an endpoint for health checks (to see if the app is running). Also consider logging errors to a file or external service so that if something goes wrong (like a crash or exception), it can be diagnosed. The AI should produce code that logs significant errors but not sensitive info.
- **Timeline & Phases:** (If relevant to mention) The development can be phased, e.g., core exam functionality first, then additional enhancements like proctoring. However, since this PRD is for the full vision, the AI should aim to implement all primary features, possibly stubbing out optional ones for future.
- **Exclusions (Out of Scope):** To avoid misinterpretation: features not described in this document are considered out of scope for the initial release. For example, any gamification beyond a basic leaderboard, integration with external Learning Management Systems, or mobile apps (the platform is web-based) are not required in this phase.

## Conclusion
This PRD provides a detailed blueprint for the GMATHS Education Online Testing Platform. It consolidates all required features – from diverse question types and flexible exam structures to rigorous anti-cheating mechanisms and scheduling capabilities – into a single comprehensive specification. Non-functional requirements like performance, security, accessibility, and maintainability have been outlined to ensure the platform is robust, safe, and user-friendly. 

By following this document, an AI coding agent (using Cursor IDE or similar) should be able to implement the platform with minimal human intervention, as all features and expectations are clearly enumerated. The end result will be a modern, efficient web-based examination system that aligns with GMATHS Education’s brand and pedagogical goals, ready to deliver a fair and engaging testing experience for Vietnamese students.