import { INITIAL_USERS, INITIAL_COURSES, INITIAL_ASSIGNMENTS } from './mockData';

// Local storage keys for persistent prototype sandbox
const STORAGE_KEYS = {
  USERS: 'wmh_lms_users',
  COURSES: 'wmh_lms_courses',
  ASSIGNMENTS: 'wmh_lms_assignments',
  TOKEN: 'wmh_lms_jwt_token',
  CURRENT_USER: 'wmh_lms_current_user',
};

// Initialize persistent state if not already populated
function getStorage(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Storage read error:', e);
  }
  localStorage.setItem(key, JSON.stringify(defaultVal));
  return defaultVal;
}

function setStorage(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

// Ensure initial database
function initializeDatabase() {
  // Force reseed: overwrite users and assignments to match the updated seed
  // (safe because the seed has been fully redesigned for the new user set)
  setStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
  setStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);

  const users = INITIAL_USERS;
  // Migrate emails and passwords if not set
  let migrated = false;
  const updatedUsers = users.map(u => {
    let email = u.email;
    if (email && email.includes('@watermelonhub.com')) {
      migrated = true;
      email = email.replace('@watermelonhub.com', '@watermelon-hub.com');
    }
    const password = u.password || (u.role === 'manager' ? 'manager2026' : 'agent2026');
    if (!u.password || email !== u.email) {
      migrated = true;
      return { ...u, email, password };
    }
    return u;
  });
  if (migrated) {
    setStorage(STORAGE_KEYS.USERS, updatedUsers);
  }
  getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
  getStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
}
initializeDatabase();

// Helper to simulate network latency
const delay = (ms = 120) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // 1. Auth & Users
  auth: {
    async login(email, password) {
      await delay();
      if (!email || !email.trim()) {
        throw new Error('Please enter your email address');
      }
      if (!password || !password.trim()) {
        throw new Error('Please enter your password');
      }

      const cleanInputEmail = email.trim().toLowerCase().replace('@watermelonhub.com', '@watermelon-hub.com');
      const users = getStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
      const user = users.find(u => {
        const uEmail = u.email.toLowerCase().replace('@watermelonhub.com', '@watermelon-hub.com');
        return uEmail === cleanInputEmail;
      });

      if (!user) {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
      if (user.status === 'disabled') {
        throw new Error('This account has been disabled. Please contact your administrator.');
      }

      const token = `jwt_token_${user.id}_${Date.now()}`;
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return {
        token,
        user: { 
          id: user.id, 
          role: user.role, 
          first_name: user.first_name,
          last_name: user.last_name,
          name: `${user.first_name} ${user.last_name}`, 
          email: user.email 
        }
      };
    },

    getCurrentUser() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.error(e);
      }
      return null;
    },

    setCurrentUser(user) {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    },

    logout() {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  users: {
    async list({ role, status, page = 1, limit = 10, search = '' } = {}) {
      await delay();
      let users = getStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
      if (role) {
        users = users.filter(u => u.role === role);
      }
      if (status) {
        users = users.filter(u => u.status === status);
      }
      if (search) {
        const q = search.toLowerCase();
        users = users.filter(u => 
          u.name.toLowerCase().includes(q) || 
          u.email.toLowerCase().includes(q)
        );
      }
      const total = users.length;
      const start = (page - 1) * limit;
      const paginated = users.slice(start, start + limit);
      return {
        data: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    },

    async create({ first_name, last_name, email, password, role = 'agent' }) {
      await delay();
      const users = getStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('User with this email already exists');
      }
      const newUser = {
        id: Date.now(),
        first_name,
        last_name,
        name: `${first_name} ${last_name}`,
        email,
        role,
        status: 'active',
        created_at: new Date().toISOString()
      };
      users.push(newUser);
      setStorage(STORAGE_KEYS.USERS, users);
      return newUser;
    },

    async update(userId, data) {
      await delay();
      const users = getStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
      const idx = users.findIndex(u => u.id === Number(userId));
      if (idx === -1) throw new Error('User not found');
      const updated = {
        ...users[idx],
        ...data,
        name: `${data.first_name || users[idx].first_name} ${data.last_name || users[idx].last_name}`
      };
      users[idx] = updated;
      setStorage(STORAGE_KEYS.USERS, users);
      return updated;
    },

    async updateStatus(userId, status) {
      await delay();
      const users = getStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
      const idx = users.findIndex(u => u.id === Number(userId));
      if (idx === -1) throw new Error('User not found');
      users[idx].status = status;
      setStorage(STORAGE_KEYS.USERS, users);
      return users[idx];
    },

    async delete(userId) {
      await delay();
      let users = getStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
      users = users.filter(u => u.id !== Number(userId));
      setStorage(STORAGE_KEYS.USERS, users);

      // Cascade remove assignments
      let assignments = getStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
      assignments = assignments.filter(a => a.agent_id !== Number(userId));
      setStorage(STORAGE_KEYS.ASSIGNMENTS, assignments);
      return { success: true };
    },

    async getAssignments(userId) {
      await delay();
      const assignments = getStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      const userAssignments = assignments.filter(a => a.agent_id === Number(userId));
      return userAssignments.map(a => {
        const course = courses.find(c => c.id === a.course_id);
        const totalItems = (course?.sections || []).reduce((acc, s) => acc + (s.items?.length || 0), 0);
        const completedCount = a.completed_item_ids?.length || 0;
        const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
        return {
          ...a,
          course_title: course?.title || 'Unknown Course',
          progress,
          total_items: totalItems
        };
      });
    }
  },

  // 2. Course Authoring (Manager Only)
  courses: {
    async list({ status, page = 1, limit = 10, search = '' } = {}) {
      await delay();
      let courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      if (status) {
        courses = courses.filter(c => c.status === status);
      }
      if (search) {
        const q = search.toLowerCase();
        courses = courses.filter(c => 
          c.title.toLowerCase().includes(q) || 
          c.description?.toLowerCase().includes(q)
        );
      }
      const total = courses.length;
      const start = (page - 1) * limit;
      const paginated = courses.slice(start, start + limit);
      return {
        data: paginated,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      };
    },

    async getById(courseId) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      const course = courses.find(c => c.id === Number(courseId));
      if (!course) throw new Error('Course not found');
      return course;
    },

    async create({ title, description }) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      const newCourse = {
        id: Date.now(),
        title,
        description,
        status: 'draft',
        created_at: new Date().toISOString(),
        sections: []
      };
      courses.unshift(newCourse);
      setStorage(STORAGE_KEYS.COURSES, courses);
      return newCourse;
    },

    async update(courseId, data) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      const idx = courses.findIndex(c => c.id === Number(courseId));
      if (idx === -1) throw new Error('Course not found');
      courses[idx] = { ...courses[idx], ...data };
      setStorage(STORAGE_KEYS.COURSES, courses);
      return courses[idx];
    },

    async delete(courseId) {
      await delay();
      let courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      courses = courses.filter(c => c.id !== Number(courseId));
      setStorage(STORAGE_KEYS.COURSES, courses);

      // Cascade remove assignments
      let assignments = getStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
      assignments = assignments.filter(a => a.course_id !== Number(courseId));
      setStorage(STORAGE_KEYS.ASSIGNMENTS, assignments);
      return { success: true };
    },

    // Sections
    async addSection(courseId, { title }) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      const course = courses.find(c => c.id === Number(courseId));
      if (!course) throw new Error('Course not found');
      if (!course.sections) course.sections = [];
      const newSection = {
        id: Date.now(),
        course_id: Number(courseId),
        title,
        order: course.sections.length + 1,
        items: []
      };
      course.sections.push(newSection);
      setStorage(STORAGE_KEYS.COURSES, courses);
      return newSection;
    },

    async reorderSections(courseId, section_ids) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      const course = courses.find(c => c.id === Number(courseId));
      if (!course) throw new Error('Course not found');
      const sectionMap = new Map((course.sections || []).map(s => [s.id, s]));
      course.sections = section_ids
        .map((id, index) => {
          const s = sectionMap.get(Number(id));
          return s ? { ...s, order: index + 1 } : null;
        })
        .filter(Boolean);
      setStorage(STORAGE_KEYS.COURSES, courses);
      return course.sections;
    },

    async updateSection(sectionId, { title }) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      let found = false;
      for (const course of courses) {
        const section = (course.sections || []).find(s => s.id === Number(sectionId));
        if (section) {
          section.title = title;
          found = true;
          break;
        }
      }
      if (!found) throw new Error('Section not found');
      setStorage(STORAGE_KEYS.COURSES, courses);
      return { success: true };
    },

    async deleteSection(sectionId) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      for (const course of courses) {
        if (course.sections) {
          course.sections = course.sections.filter(s => s.id !== Number(sectionId));
        }
      }
      setStorage(STORAGE_KEYS.COURSES, courses);
      return { success: true };
    },

    // Items
    async addItem(sectionId, { title, type, content_url = '', text_content = '' }) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      let createdItem = null;
      for (const course of courses) {
        const section = (course.sections || []).find(s => s.id === Number(sectionId));
        if (section) {
          if (!section.items) section.items = [];
          createdItem = {
            id: Date.now(),
            section_id: Number(sectionId),
            title,
            type, // video, audio, text, quiz
            content_url,
            text_content,
            questions: type === 'quiz' ? [] : undefined
          };
          section.items.push(createdItem);
          break;
        }
      }
      if (!createdItem) throw new Error('Section not found');
      setStorage(STORAGE_KEYS.COURSES, courses);
      return createdItem;
    },

    async reorderItems(sectionId, item_ids) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      for (const course of courses) {
        const section = (course.sections || []).find(s => s.id === Number(sectionId));
        if (section && section.items) {
          const itemMap = new Map(section.items.map(i => [i.id, i]));
          section.items = item_ids.map(id => itemMap.get(Number(id))).filter(Boolean);
          break;
        }
      }
      setStorage(STORAGE_KEYS.COURSES, courses);
      return { success: true };
    },

    async updateItem(itemId, data) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      let updatedItem = null;
      for (const course of courses) {
        for (const section of course.sections || []) {
          const item = (section.items || []).find(i => i.id === Number(itemId));
          if (item) {
            Object.assign(item, data);
            updatedItem = item;
            break;
          }
        }
        if (updatedItem) break;
      }
      if (!updatedItem) throw new Error('Item not found');
      setStorage(STORAGE_KEYS.COURSES, courses);
      return updatedItem;
    },

    async deleteItem(itemId) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      for (const course of courses) {
        for (const section of course.sections || []) {
          if (section.items) {
            section.items = section.items.filter(i => i.id !== Number(itemId));
          }
        }
      }
      setStorage(STORAGE_KEYS.COURSES, courses);
      return { success: true };
    },

    // Quiz Questions
    async addQuestion(itemId, { type, prompt, options }) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      let newQuestion = null;
      for (const course of courses) {
        for (const section of course.sections || []) {
          const item = (section.items || []).find(i => i.id === Number(itemId));
          if (item) {
            if (!item.questions) item.questions = [];
            newQuestion = {
              id: Date.now(),
              item_id: Number(itemId),
              type, // multiple_choice, true_false, multiple_answer
              prompt,
              options: options.map((opt, i) => ({
                id: opt.id || Date.now() + i,
                text: opt.text,
                is_correct: !!opt.is_correct
              }))
            };
            item.questions.push(newQuestion);
            break;
          }
        }
        if (newQuestion) break;
      }
      if (!newQuestion) throw new Error('Quiz item not found');
      setStorage(STORAGE_KEYS.COURSES, courses);
      return newQuestion;
    },

    async updateQuestion(questionId, data) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      let updatedQuestion = null;
      for (const course of courses) {
        for (const section of course.sections || []) {
          for (const item of section.items || []) {
            const question = (item.questions || []).find(q => q.id === Number(questionId));
            if (question) {
              Object.assign(question, data);
              updatedQuestion = question;
              break;
            }
          }
          if (updatedQuestion) break;
        }
        if (updatedQuestion) break;
      }
      if (!updatedQuestion) throw new Error('Question not found');
      setStorage(STORAGE_KEYS.COURSES, courses);
      return updatedQuestion;
    },

    async deleteQuestion(questionId) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      for (const course of courses) {
        for (const section of course.sections || []) {
          for (const item of section.items || []) {
            if (item.questions) {
              item.questions = item.questions.filter(q => q.id !== Number(questionId));
            }
          }
        }
      }
      setStorage(STORAGE_KEYS.COURSES, courses);
      return { success: true };
    }
  },

  // 3. Assignments & Progress Views (Manager Only)
  assignments: {
    async assignBulk({ course_id, agent_ids }) {
      await delay();
      const assignments = getStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
      agent_ids.forEach(agentId => {
        const exists = assignments.find(a => a.course_id === Number(course_id) && a.agent_id === Number(agentId));
        if (!exists) {
          assignments.push({
            course_id: Number(course_id),
            agent_id: Number(agentId),
            completed_item_ids: [],
            status: 'not_started',
            assigned_at: new Date().toISOString(),
            completed_at: null
          });
        }
      });
      setStorage(STORAGE_KEYS.ASSIGNMENTS, assignments);
      return { success: true };
    },

    async unassignBulk({ course_id, agent_ids }) {
      await delay();
      let assignments = getStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
      const idSet = new Set(agent_ids.map(Number));
      assignments = assignments.filter(a => !(a.course_id === Number(course_id) && idSet.has(a.agent_id)));
      setStorage(STORAGE_KEYS.ASSIGNMENTS, assignments);
      return { success: true };
    },

    async getCourseAssignments(courseId) {
      await delay();
      const assignments = getStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
      const users = getStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      const course = courses.find(c => c.id === Number(courseId));
      
      const totalItems = (course?.sections || []).reduce((acc, s) => acc + (s.items?.length || 0), 0);
      const courseAssignments = assignments.filter(a => a.course_id === Number(courseId));

      return courseAssignments.map(a => {
        const agent = users.find(u => u.id === a.agent_id);
        const completedCount = a.completed_item_ids?.length || 0;
        const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
        return {
          agent_id: a.agent_id,
          agent_name: agent ? agent.name : `Agent #${a.agent_id}`,
          agent_email: agent ? agent.email : '',
          status: a.status,
          progress,
          completed_items_count: completedCount,
          total_items: totalItems,
          assigned_at: a.assigned_at,
          completed_at: a.completed_at
        };
      });
    }
  },

  // 4. Agent Learning Experience
  learn: {
    async getCourses(agentId) {
      await delay();
      const assignments = getStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      
      const agentAssignments = assignments.filter(a => a.agent_id === Number(agentId));
      const result = {
        in_progress: [],
        not_started: [],
        completed: []
      };

      for (const a of agentAssignments) {
        const course = courses.find(c => c.id === a.course_id && c.status === 'published');
        if (!course) continue;

        const totalItems = (course.sections || []).reduce((acc, s) => acc + (s.items?.length || 0), 0);
        const completedCount = a.completed_item_ids?.length || 0;
        const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

        const courseItem = {
          ...course,
          progress,
          completed_item_ids: a.completed_item_ids || [],
          total_items: totalItems,
          assigned_at: a.assigned_at,
          completed_at: a.completed_at,
          status: a.status
        };

        if (a.status === 'completed' || progress === 100) {
          result.completed.push(courseItem);
        } else if (a.status === 'in_progress' || completedCount > 0) {
          result.in_progress.push(courseItem);
        } else {
          result.not_started.push(courseItem);
        }
      }

      return result;
    },

    async getCourseTree(courseId, agentId) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      const assignments = getStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
      const course = courses.find(c => c.id === Number(courseId));
      if (!course) throw new Error('Course not found');

      const assignment = assignments.find(a => a.course_id === Number(courseId) && a.agent_id === Number(agentId));
      const completed_item_ids = assignment?.completed_item_ids || [];

      return {
        ...course,
        completed_item_ids,
        assignment_status: assignment?.status || 'not_started'
      };
    },

    async resumeCourse(courseId, agentId) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      const assignments = getStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
      const course = courses.find(c => c.id === Number(courseId));
      if (!course) throw new Error('Course not found');

      // Flatten items in order
      const allItems = [];
      (course.sections || []).forEach(sec => {
        (sec.items || []).forEach(item => {
          allItems.push(item);
        });
      });

      if (allItems.length === 0) {
        return { next_item_id: null };
      }

      const assignment = assignments.find(a => a.course_id === Number(courseId) && a.agent_id === Number(agentId));
      const completedSet = new Set(assignment?.completed_item_ids || []);

      // Find first uncompleted item
      const nextItem = allItems.find(item => !completedSet.has(item.id));
      
      // Fallback seamlessly to the first item if all complete or none found
      return {
        next_item_id: nextItem ? nextItem.id : allItems[0].id
      };
    },

    async completeItem(itemId, courseId, agentId) {
      await delay();
      const assignments = getStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      const course = courses.find(c => c.id === Number(courseId));

      let assignment = assignments.find(a => a.course_id === Number(courseId) && a.agent_id === Number(agentId));
      if (!assignment) {
        assignment = {
          course_id: Number(courseId),
          agent_id: Number(agentId),
          completed_item_ids: [],
          status: 'in_progress',
          assigned_at: new Date().toISOString(),
          completed_at: null
        };
        assignments.push(assignment);
      }

      if (!assignment.completed_item_ids.includes(Number(itemId))) {
        assignment.completed_item_ids.push(Number(itemId));
      }

      // Check if course is 100% complete
      const totalItems = (course?.sections || []).reduce((acc, s) => acc + (s.items?.length || 0), 0);
      const isComplete = totalItems > 0 && assignment.completed_item_ids.length >= totalItems;

      if (isComplete) {
        assignment.status = 'completed';
        assignment.completed_at = new Date().toISOString();
      } else {
        assignment.status = 'in_progress';
      }

      setStorage(STORAGE_KEYS.ASSIGNMENTS, assignments);
      return {
        success: true,
        is_course_completed: isComplete,
        completed_item_ids: assignment.completed_item_ids
      };
    },

    async submitQuiz(itemId, courseId, agentId, answers) {
      await delay();
      const courses = getStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
      let quizItem = null;
      for (const course of courses) {
        for (const section of course.sections || []) {
          const item = (section.items || []).find(i => i.id === Number(itemId));
          if (item && item.type === 'quiz') {
            quizItem = item;
            break;
          }
        }
        if (quizItem) break;
      }

      if (!quizItem) throw new Error('Quiz item not found');

      const questions = quizItem.questions || [];
      const totalQuestions = questions.length;
      let correctCount = 0;
      const incorrect_question_ids = [];

      questions.forEach(q => {
        const userAnswer = answers.find(a => a.question_id === q.id);
        const selectedIds = (userAnswer?.selected_option_ids || []).map(Number);
        const correctIds = (q.options || []).filter(o => o.is_correct).map(o => o.id);

        const isExactMatch = 
          selectedIds.length === correctIds.length &&
          selectedIds.every(id => correctIds.includes(id));

        if (isExactMatch) {
          correctCount++;
        } else {
          incorrect_question_ids.push(q.id);
        }
      });

      // Strict 100% pass requirement rule
      const passed = correctCount === totalQuestions && totalQuestions > 0;

      if (passed) {
        // Automatically mark quiz completed
        await api.learn.completeItem(itemId, courseId, agentId);
        return {
          passed: true,
          score: `${correctCount}/${totalQuestions}`,
          score_percentage: 100
        };
      } else {
        return {
          passed: false,
          score: `${correctCount}/${totalQuestions}`,
          score_percentage: Math.round((correctCount / (totalQuestions || 1)) * 100),
          incorrect_question_ids
        };
      }
    }
  }
};
